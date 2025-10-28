# Error Handling & Monitoring

## Overview

BioQuest implements a comprehensive, centralized error handling system with Sentry integration for production monitoring. The system provides:

- **Type-safe error classes** with error codes
- **Centralized logging** to console and Sentry
- **User-friendly error messages**
- **React Error Boundaries** for component-level errors
- **API route error handlers** with standardized responses
- **iNaturalist API error handling** with rate limiting awareness

---

## Architecture

### Error Types Hierarchy

```
Error (JavaScript built-in)
  └── AppError (Custom base class)
        ├── APIError (Generic API errors)
        ├── RateLimitError (429 errors)
        ├── UnauthorizedError (401 errors)
        ├── NotFoundError (404 errors)
        ├── ValidationError (400 validation errors)
        ├── INatError (iNaturalist-specific errors)
        ├── DatabaseError (Database operation errors)
        └── SyncError (Observation sync errors)
```

### Error Codes

All errors have numeric error codes for easier tracking and debugging:

| Range | Category | Examples |
|-------|----------|----------|
| 1000-1999 | API Errors | 1001: Rate Limit, 1002: Unauthorized |
| 2000-2999 | iNaturalist Errors | 2001: Auth Failed, 2002: Rate Limit |
| 3000-3999 | Database Errors | 3001: Connection, 3002: Query |
| 4000-4999 | Validation Errors | 4001: Required Field, 4002: Invalid Format |
| 5000-5999 | Business Logic | 5001: Sync Failed, 5002: Gamification Error |
| 9000+ | Unknown/Generic | 9000: Unknown Error |

---

## Usage Guide

### 1. API Routes

Always use `withAPIErrorHandler` wrapper for API routes:

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  withAPIErrorHandler,
  createSuccessResponse,
  createErrorResponse,
  ValidationError,
  NotFoundError,
} from '@/lib/errors';

async function handleRequest(req: NextRequest): Promise<NextResponse> {
  // Get parameters
  const { id } = await req.json();

  // Throw typed errors - they'll be caught and formatted automatically
  if (!id) {
    throw new ValidationError('ID is required');
  }

  const item = await database.find(id);

  if (!item) {
    throw new NotFoundError(`Item with ID ${id} not found`);
  }

  // Return success responses
  return createSuccessResponse(item);
}

// Export with error handler wrapper
export const POST = withAPIErrorHandler(handleRequest);
```

**Benefits:**
- Automatic error logging to Sentry
- Standardized JSON error responses
- User-friendly error messages
- Proper HTTP status codes

### 2. React Components

#### Error Boundaries

Wrap components that might error with `ErrorBoundary`:

```typescript
// src/app/layout.tsx
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
```

#### Async Components

Use `AsyncBoundary` for components with async data:

```typescript
import { AsyncBoundary } from '@/components/errors/AsyncBoundary';

export function MyPage() {
  return (
    <AsyncBoundary
      loadingFallback={<LoadingSpinner />}
      errorFallback={<CustomErrorUI />}
    >
      <AsyncDataComponent />
    </AsyncBoundary>
  );
}
```

### 3. Manual Error Logging

Log errors manually when needed:

```typescript
import { logError } from '@/lib/errors';

try {
  await riskyOperation();
} catch (error) {
  logError(error as Error, {
    userId: user.id,
    operation: 'riskyOperation',
    customData: { foo: 'bar' }
  });

  // Re-throw or handle gracefully
  throw error;
}
```

### 4. Client-Side Error Handling

```typescript
'use client';

import { toast } from 'sonner';
import { getUserFriendlyMessage } from '@/lib/errors';

async function syncData() {
  try {
    const response = await fetch('/api/sync', { method: 'POST' });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Sync failed');
    }

    toast.success('Sync complete!');
  } catch (error) {
    const message = getUserFriendlyMessage(error as Error);
    toast.error(message);
  }
}
```

---

## Sentry Integration

### Setup

1. Create a Sentry account at [sentry.io](https://sentry.io)
2. Create a new Next.js project
3. Copy your DSN from Sentry dashboard
4. Add to `.env.local`:

```bash
# Client-side (public)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production

# Server-side (private)
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ENVIRONMENT=production
```

### Configuration Files

Three Sentry config files handle different contexts:

- `sentry.client.config.ts` - Client-side errors (browser)
- `sentry.server.config.ts` - Server-side errors (API routes)
- `sentry.edge.config.ts` - Edge runtime errors (middleware)

### What Gets Reported

**Automatically tracked:**
- API route errors
- React component errors (via ErrorBoundary)
- iNaturalist API failures
- Database errors
- Unhandled promise rejections

**Includes:**
- Error message and stack trace
- User context (if authenticated)
- Custom tags (error_code, is_operational)
- Request context (endpoint, HTTP method)
- Environment (development, production)

**Filtered out (by default):**
- Expected network errors ("Failed to fetch", "Network request failed")
- Temporary connection issues (ECONNREFUSED, ETIMEDOUT)

### Development vs. Production

**Development:**
- All errors logged to console
- Sentry optional (if DSN provided)
- 100% sample rate
- Debug mode enabled

**Production:**
- Errors sent to Sentry
- 10% trace sample rate (performance)
- Session replay on errors
- User-friendly messages shown

---

## Best Practices

### 1. Use Typed Errors

❌ **Bad:**
```typescript
throw new Error('User not found');
```

✅ **Good:**
```typescript
throw new NotFoundError('User not found', {
  userId: requestedUserId,
  endpoint: '/api/users',
});
```

### 2. Provide Context

Always include relevant context:

```typescript
throw new SyncError('Failed to sync observations', {
  userId: user.id,
  inatUsername: user.inatUsername,
  observationCount: count,
  lastSyncedAt: lastSync,
});
```

### 3. Distinguish Operational vs. Programming Errors

**Operational errors** (expected, recoverable):
- User not found
- Network timeout
- Rate limit exceeded
- Validation failures

**Programming errors** (bugs, should not happen):
- Null pointer exceptions
- Type errors
- Logic bugs

```typescript
// Operational - expected, user-friendly message
throw new RateLimitError('Too many requests, please wait');

// Programming error - should be fixed in code
throw new Error('Unexpected null value in calculatePoints');
```

### 4. Don't Over-Log

Avoid logging every error. Some are expected:

```typescript
// Don't log expected errors
if (!user) {
  throw new NotFoundError('User not found'); // Not logged
}

// Do log unexpected errors
try {
  const result = await criticalOperation();
} catch (error) {
  logError(error); // Logged to Sentry
  throw error;
}
```

---

## Testing Error Handling

### Manual Testing

```typescript
// Create a test endpoint to verify Sentry integration
// src/app/api/test-error/route.ts
export async function GET() {
  throw new Error('Test error for Sentry verification');
}
```

Visit `/api/test-error` and check:
1. Error appears in Sentry dashboard
2. Stack trace is complete
3. Context data is attached
4. User-friendly message shown

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { getUserFriendlyMessage, AppError, ErrorCode } from '@/lib/errors';

describe('Error Handling', () => {
  it('returns user-friendly message for rate limit', () => {
    const error = new AppError(
      'Internal rate limit message',
      ErrorCode.API_RATE_LIMIT,
      429
    );

    expect(getUserFriendlyMessage(error)).toBe(
      'Too many requests. Please try again in a few minutes.'
    );
  });

  it('returns generic message for unknown errors', () => {
    const error = new Error('Some internal error');

    expect(getUserFriendlyMessage(error)).toBe(
      'An unexpected error occurred. Please try again.'
    );
  });
});
```

---

## Monitoring & Alerts

### Sentry Dashboard

Key metrics to monitor:

1. **Error frequency** - Spikes indicate issues
2. **Error types** - Recurring errors need attention
3. **Affected users** - High user impact = high priority
4. **Response times** - Performance degradation
5. **Release tracking** - Errors per deployment

### Alert Rules (Recommended)

Set up Sentry alerts for:

- **Critical errors** (500s, database failures)
  - Threshold: >10 errors in 5 minutes
  - Notify: Slack, Email

- **Auth failures** (401s, 403s)
  - Threshold: >50 errors in 10 minutes
  - Notify: Email

- **Rate limits** (429s)
  - Threshold: >100 errors in 10 minutes
  - Notify: Slack

---

## Troubleshooting

### Errors Not Appearing in Sentry

**Check:**
1. DSN configured correctly in `.env`
2. `sentry.*.config.ts` files are present
3. Error is not filtered out in `beforeSend` hook
4. Network access to sentry.io is allowed
5. Sentry CLI installed: `npm install @sentry/cli`

### Too Many Errors

**Solutions:**
1. Add more filters in `beforeSend`
2. Reduce sample rate in production
3. Fix root causes (check top errors in dashboard)

### Missing Context

**Add more context:**
```typescript
logError(error, {
  user: { id, email },
  request: { method, url, body },
  custom: { featureFlag, experimentGroup },
});
```

---

## Migration Guide

### Updating Existing API Routes

**Before:**
```typescript
export async function POST(req: NextRequest) {
  try {
    // ... logic
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
```

**After:**
```typescript
import { withAPIErrorHandler, createSuccessResponse, ValidationError } from '@/lib/errors';

async function handlePost(req: NextRequest) {
  // ... logic (throw typed errors)
  if (!data) {
    throw new ValidationError('Data required');
  }

  return createSuccessResponse({ success: true });
}

export const POST = withAPIErrorHandler(handlePost);
```

---

## Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Error Handling Best Practices](https://www.joyent.com/node-js/production/design/errors)
- [HTTP Status Codes](https://httpstatuses.com/)

---

**Last Updated:** October 28, 2025
