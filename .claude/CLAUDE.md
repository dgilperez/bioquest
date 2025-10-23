# BioQuest - Claude Development Guide

## Project Overview

BioQuest is a comprehensive gamified companion app for iNaturalist that transforms biodiversity observation into an engaging, game-like experience. The app adds points, levels, badges, quests, and social features on top of iNaturalist's citizen science platform while maintaining data quality and ethical observation practices.

**Mission**: Make nature observation as addictive and fun as a game, especially for youth and newcomers, while preserving scientific data integrity and respecting iNaturalist's terms of service.

## Technical Stack

### Core Technologies
- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM (SQLite for development)
- **Authentication**: NextAuth.js with iNaturalist OAuth 2.0
- **State Management**: React Server Components + React Query
- **Testing**: Vitest + Testing Library
- **Deployment**: Vercel (recommended) / Railway / Fly.io

### Project Structure
```
bioquest/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes (iNat proxy, gamification)
│   │   ├── (auth)/             # Auth pages group
│   │   ├── (dashboard)/        # Protected dashboard pages
│   │   └── layout.tsx
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui base components
│   │   ├── auth/               # Authentication components
│   │   ├── stats/              # Statistics & analytics
│   │   ├── badges/             # Badge system
│   │   └── quests/             # Quest system
│   ├── lib/                    # Core business logic
│   │   ├── inat/               # iNaturalist API client
│   │   ├── gamification/       # Points, badges, rarity engine
│   │   ├── db/                 # Database utilities
│   │   └── utils/              # Helper functions
│   └── types/                  # TypeScript type definitions
├── prisma/                     # Database schema & migrations
├── tests/                      # Test suites
├── docs/                       # Documentation
└── public/                     # Static assets
```

## Development Guidelines

### Code Style
- Follow idiomatic TypeScript and React patterns
- Use Next.js 14 App Router conventions (Server Components by default)
- DRY principle - avoid code duplication
- Prefer composition over inheritance
- Use functional programming patterns where appropriate

### Testing Requirements
- Unit tests for all gamification logic (points, badges, rarity)
- Component tests for UI elements
- Integration tests for API routes and iNat client
- Maintain high test coverage (target: 80%+)
- Test error handling thoroughly

### Architecture Patterns

#### Server Components First
```typescript
// Default to Server Components for data fetching
async function DashboardPage() {
  const stats = await getUserStats();  // Fetch on server
  return <StatsDisplay stats={stats} />;
}
```

#### Client Components for Interactivity
```typescript
'use client';  // Only when needed for client-side state/interactivity

export function BadgeUnlockAnimation({ badge }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  // Client-side animation logic
}
```

#### API Route Pattern
```typescript
// src/app/api/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stats = await calculateUserStats(session.user.id);
  return NextResponse.json(stats);
}
```

## iNaturalist API Integration

### Authentication Flow
1. User clicks "Sign in with iNaturalist"
2. Redirect to iNat OAuth page
3. User authorizes app
4. iNat redirects to callback with code
5. Exchange code for access token
6. Store token securely in session

### API Client Best Practices
```typescript
// src/lib/inat/client.ts
export class INatClient {
  private static readonly BASE_URL = 'https://api.inaturalist.org/v1';
  private static readonly RATE_LIMIT = 60; // requests per minute

  async getUserObservations(userId: number, options?: QueryOptions) {
    // Implement rate limiting
    // Handle pagination
    // Cache results when appropriate
    // Return typed data
  }
}
```

### Rate Limiting
- Maximum 60 requests/minute per user
- Implement request queuing
- Cache frequently accessed data
- Use batch endpoints when available

### Data Attribution
- Always credit photo/observation authors
- Respect license requirements (CC-BY, CC0, All Rights Reserved)
- Link back to original iNat observations
- Follow iNat's Terms of Service

## Gamification Engine

### Points System
```typescript
export function calculatePoints(observation: INatObservation): PointsCalculation {
  let basePoints = 10;  // Base per observation
  const bonuses = {
    newSpecies: observation.isNewSpecies ? 50 : 0,
    rarity: getRarityBonus(observation),  // 0, 100, 500 for normal/rare/legendary
    researchGrade: observation.quality_grade === 'research' ? 25 : 0,
    photos: Math.min(observation.photos?.length || 0, 3) * 5,
  };

  return {
    basePoints,
    bonusPoints: bonuses,
    totalPoints: basePoints + Object.values(bonuses).reduce((a, b) => a + b, 0),
  };
}
```

### Rarity Classification
- **Normal**: Species with >1000 observations on iNat
- **Rare**: Species with 100-1000 observations
- **Legendary**:
  - <100 observations globally, OR
  - First observation of species on iNat, OR
  - First in region/country, OR
  - IUCN Red List species

### Badge System
Badge categories:
1. **Milestone**: 10, 100, 1000 observations
2. **Taxon Explorer**: Species counts per taxonomic group
3. **Rarity**: Rare/legendary finds
4. **Geography**: Locations visited
5. **Time/Seasonal**: Observation streaks, seasonal activity
6. **Challenge**: Quest completions
7. **Secret**: Easter eggs, special achievements

### Quest Types
- **Daily**: Simple tasks (e.g., "Upload 1 observation today")
- **Weekly**: Medium effort (e.g., "Find 5 different bird species")
- **Monthly**: Themed challenges (e.g., "Pollinator Month - observe 10 pollinators")
- **Personal**: User-created goals

## Database Schema (Prisma)

Key models:
- `User`: iNat user data + app-specific stats
- `Observation`: Cached iNat observations for performance
- `UserStats`: Aggregated statistics (points, level, species count)
- `Badge`: Badge definitions
- `UserBadge`: Unlocked badges per user
- `Quest`: Quest definitions
- `UserQuest`: Active/completed quests per user

## Security & Privacy

### Authentication
- Use NextAuth.js for session management
- Secure token storage (HTTP-only cookies)
- CSRF protection enabled
- Refresh token handling

### Data Protection
- Never store user passwords (OAuth only)
- Respect iNat geoprivacy settings
- Don't expose sensitive location data
- GDPR compliance (allow data export/deletion)

### API Security
- Rate limiting on all endpoints
- Input validation with Zod
- SQL injection prevention (Prisma parameterized queries)
- XSS protection (Next.js auto-escaping)

## Performance Optimization

### Caching Strategy
1. **iNat API responses**: Cache for 5-15 minutes
2. **User stats**: Calculate once, cache until new observation
3. **Badges/Achievements**: Check on observation create, cache results
4. **Leaderboards**: Update every hour

### Image Optimization
- Use Next.js Image component
- Lazy load images below the fold
- Serve appropriate sizes for device
- Consider CDN for static assets

## Testing Strategy

### Unit Tests
```typescript
// tests/lib/gamification/points.test.ts
import { describe, it, expect } from 'vitest';
import { calculatePoints } from '@/lib/gamification/points';

describe('Points Calculation', () => {
  it('awards base points for any observation', () => {
    const result = calculatePoints(mockObservation);
    expect(result.basePoints).toBe(10);
  });

  it('awards bonus for new species', () => {
    const result = calculatePoints({ ...mockObservation, isNewSpecies: true });
    expect(result.bonusPoints.newSpecies).toBe(50);
  });
});
```

### Component Tests
```typescript
// tests/components/BadgeCard.test.tsx
import { render, screen } from '@testing-library/react';
import { BadgeCard } from '@/components/badges/BadgeCard';

it('renders badge name and description', () => {
  render(<BadgeCard badge={mockBadge} />);
  expect(screen.getByText('First Steps')).toBeInTheDocument();
});
```

## Common Development Tasks

### Adding a New Badge
1. Define badge in `src/lib/gamification/badges/definitions.ts`
2. Implement unlock logic in `src/lib/gamification/badges/unlock.ts`
3. Create badge icon/image
4. Add to database seed
5. Write tests for unlock conditions
6. Update documentation

### Adding a New Quest Type
1. Define quest schema in Prisma
2. Implement progress tracking logic
3. Create UI components for quest display
4. Add quest generation logic (for automatic quests)
5. Test completion flow
6. Document quest criteria

### Integrating New iNat API Endpoint
1. Add types to `src/types/index.ts`
2. Implement in `src/lib/inat/client.ts`
3. Add rate limiting and caching
4. Write integration tests
5. Document usage

## Deployment

### Environment Variables
Required for production:
```
DATABASE_URL=postgresql://...
INATURALIST_CLIENT_ID=...
INATURALIST_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://bioquest.app
```

### Build Process
```bash
npm run build       # Type-check + build
npm run test        # Run test suite
npm run lint        # Check code quality
npm run db:migrate  # Run database migrations
```

### Monitoring
- Track API error rates
- Monitor iNat API usage (stay under rate limits)
- Watch database performance
- User engagement metrics
- Badge unlock rates (adjust difficulty if needed)

## Important Notes for AI Assistants

When working on this project:
1. **iNat API Compliance**: Always respect rate limits and terms of service
2. **Data Quality**: Design features to encourage quality observations, not spam
3. **Ethical Wildlife Observation**: Never incentivize harmful behavior (disturbing animals, trespassing)
4. **Performance**: This app will scale - design with performance in mind
5. **Accessibility**: Ensure all UI is keyboard-navigable and screen-reader friendly
6. **Internationalization**: Prepare for multi-language support (especially Spanish)
7. **Mobile-First**: Most users will access on mobile (PWA, then Flutter)
8. **Test Coverage**: Don't skip tests - gamification logic is complex
9. **Documentation**: Keep ARCHITECTURE.md and API.md updated
10. **User Privacy**: Be paranoid about data protection

## Migration to Flutter (Future)

This Next.js PWA is Phase 1. Phase 2 will be a Flutter native app that:
- Consumes the same Next.js backend API
- Adds camera integration for observation upload
- Implements offline-first with local database
- Uses GPS for better location tagging
- Adds native push notifications

Reference the Mazao Flutter app structure (`../mazao`) for best practices when that time comes.

## Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [iNaturalist API](https://api.inaturalist.org/v1/docs/)
- [Prisma Docs](https://www.prisma.io/docs)
- [shadcn/ui](https://ui.shadcn.com/)

### Internal Docs
- `/docs/ARCHITECTURE.md` - System architecture
- `/docs/API.md` - API documentation
- `/docs/GAMIFICATION.md` - Gamification design
- `/doc/initial-research-plan.md` - Original vision document

---

**Project Start**: January 2025
**Current Phase**: Phase 1 - Next.js PWA MVP
**Target MVP**: 6 weeks
**Vision**: Make nature observation irresistibly fun while advancing citizen science
