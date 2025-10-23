# BioQuest Architecture

## System Overview

BioQuest is built as a modern web application using Next.js 14 with a planned migration to Flutter for native mobile. The architecture follows clean code principles with clear separation of concerns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Next.js App (React Server Components + Client)       │  │
│  │  - Server Components (data fetching, rendering)       │  │
│  │  - Client Components (interactivity, animations)      │  │
│  │  - shadcn/ui components (UI primitives)               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │ ▲
                            │ │ HTTP/JSON
                            ▼ │
┌─────────────────────────────────────────────────────────────┐
│                      API/Backend Layer                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Next.js API Routes (Serverless Functions)            │  │
│  │  - /api/auth/* (NextAuth.js)                          │  │
│  │  - /api/stats/* (User statistics)                     │  │
│  │  - /api/badges/* (Badge management)                   │  │
│  │  - /api/quests/* (Quest system)                       │  │
│  │  - /api/inat/* (iNaturalist proxy)                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────────┐  ┌─────────────────┐
│  PostgreSQL  │  │  iNaturalist API │  │  Cache Layer    │
│  (Prisma)    │  │  (External)      │  │  (Memory/Redis) │
└──────────────┘  └──────────────────┘  └─────────────────┘
```

## Core Layers

### 1. Presentation Layer (`src/app`, `src/components`)
- **Responsibility**: UI rendering, user interaction, routing
- **Technologies**: Next.js App Router, React 18, Tailwind CSS, shadcn/ui
- **Key Patterns**:
  - Server Components for data fetching
  - Client Components for interactivity
  - Suspense boundaries for loading states
  - Error boundaries for error handling

### 2. Business Logic Layer (`src/lib`)
- **Responsibility**: Core application logic, gamification engine
- **Modules**:
  - `/gamification`: Points, badges, rarity, quests
  - `/inat`: iNaturalist API client
  - `/db`: Database utilities
  - `/utils`: Helper functions

### 3. Data Layer (`src/lib/db`, Prisma)
- **Responsibility**: Data persistence, caching, external API integration
- **Components**:
  - Prisma ORM for database access
  - iNaturalist API client
  - Redis/memory cache for performance

## Key Subsystems

### Authentication System
```
User → Sign In → iNaturalist OAuth → Callback → NextAuth Session → Database
```
- OAuth 2.0 flow with iNaturalist
- Session management via NextAuth.js
- HTTP-only cookies for security
- Token refresh handling

### Gamification Engine

#### Points Calculation
```typescript
Observation → Parse Metadata →
  ├─ Base Points (10)
  ├─ New Species Bonus (+50)
  ├─ Rarity Bonus (0/100/500)
  ├─ Research Grade Bonus (+25)
  └─ Photo Bonus (+5 each, max 3)
→ Total Points → Update User Level
```

#### Rarity Classification
```typescript
Taxon → Query iNat API for Observation Count →
  ├─ >1000 observations → Normal
  ├─ 100-1000 observations → Rare
  └─ <100 observations OR first record → Legendary
```

#### Badge Unlocking
```typescript
User Action → Check All Badge Criteria →
  ├─ Criteria Met → Unlock Badge → Store in DB → Notify User
  └─ Criteria Not Met → Update Progress Bar
```

### iNaturalist Integration

#### Data Flow
```
1. User authorizes app via OAuth
2. App receives access token
3. Token stored in session (encrypted)
4. API requests include token
5. Responses cached (5-15 min TTL)
6. Observations synced to local DB
```

#### Rate Limiting Strategy
- Global: 60 requests/minute
- Per endpoint throttling
- Request queue with priority
- Cache-first approach
- Batch requests when possible

### Database Schema (Simplified)

```
User (1) ──────┬─────< UserBadge (M)
               ├─────< UserQuest (M)
               ├─────< Observation (M)
               └─────< UserStats (1)

Badge (1) ────< UserBadge (M)
Quest (1) ────< UserQuest (M)
```

See Prisma schema for full details.

## Security Architecture

### Authentication
- OAuth 2.0 with PKCE
- HTTP-only session cookies
- CSRF tokens
- Secure token storage

### Authorization
- Session-based auth for all protected routes
- Middleware guards
- API route protection
- User-scoped data queries

### Data Protection
- Environment variable secrets
- Encrypted database connections
- No sensitive data in logs
- Respect iNat geoprivacy settings

## Performance Optimizations

### Caching Strategy
| Data Type | TTL | Storage |
|-----------|-----|---------|
| User observations | 15 min | Redis/Memory |
| Badge definitions | 24 hours | Memory |
| Species metadata | 1 hour | Database |
| Leaderboards | 15 min | Database |
| User stats | Until invalidated | Database |

### Database Optimization
- Indexed queries (userId, observationId)
- Denormalized stats table
- Batch updates
- Connection pooling
- Read replicas (future)

### Frontend Performance
- Server-side rendering
- Static generation for public pages
- Image optimization (Next.js Image)
- Code splitting
- Lazy loading
- Prefetching

## Deployment Architecture

### Development
```
Local → SQLite → Next.js Dev Server → localhost:3000
```

### Production (Vercel)
```
GitHub → Vercel Build →
  ├─ Next.js App (Edge/Serverless)
  ├─ PostgreSQL (Vercel Postgres)
  └─ Redis (Vercel KV) [optional]
```

### Environment Isolation
- **Development**: Local SQLite, mock data
- **Staging**: Vercel Preview, real iNat API (test account)
- **Production**: Vercel Production, PostgreSQL, Redis

## Monitoring & Observability

### Metrics to Track
- API response times
- iNat API usage (rate limits)
- Database query performance
- Error rates by endpoint
- User engagement (observations/day)
- Badge unlock rates

### Error Handling
- Global error boundary
- API error responses
- Sentry integration (future)
- User-friendly error messages
- Automatic retry for transient failures

## Future: Flutter Migration

### Phase 2 Architecture
```
Flutter App (Mobile) ──┐
Web App (Next.js)    ──┤
                       ├─→ Shared Backend API (Next.js)
                       │    ├─ /api/v1/*
                       │    └─ PostgreSQL
                       │
                       └─→ iNaturalist API
```

Flutter app will:
- Consume same Next.js API
- Add camera, GPS, offline storage
- Use Hive/SQLite for local caching
- Sync with backend when online
- Reference Mazao app architecture

## Testing Strategy

### Unit Tests (Vitest)
- Gamification logic
- Utility functions
- Type definitions
- API client functions

### Component Tests (Testing Library)
- UI components
- User interactions
- Accessibility

### Integration Tests
- API routes
- Database operations
- Auth flows
- iNat client

### E2E Tests (Playwright) [Future]
- Complete user journeys
- Critical paths
- Cross-browser testing

## Scalability Considerations

### Current Load Estimates
- **Users**: 100-10,000 (MVP)
- **Observations**: 10,000-1,000,000 cached
- **Requests/min**: 100-10,000

### Scaling Strategy
1. **Vertical scaling**: Increase serverless concurrency
2. **Caching**: Redis for hot data
3. **Database**: Read replicas, query optimization
4. **CDN**: Static assets via Vercel Edge
5. **Background jobs**: Queue for heavy processing

## Development Workflow

### Feature Development
```
1. Design API/schema changes
2. Update types (`src/types`)
3. Implement business logic (`src/lib`)
4. Create API routes (`src/app/api`)
5. Build UI components (`src/components`)
6. Write tests
7. Update documentation
```

### Database Changes
```
1. Update Prisma schema
2. Run `npx prisma migrate dev`
3. Generate client: `npx prisma generate`
4. Update TypeScript types
5. Test migrations
```

---

**Last Updated**: January 2025
**Version**: 1.0 (PWA MVP)
