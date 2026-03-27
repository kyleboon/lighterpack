# Rate Limiting for Auth and Image Upload Endpoints

## Problem

The `authRateLimit` config value exists but is never enforced. Without rate limiting:

- The magic link endpoint can be abused to send unlimited emails (costs money via Mailgun, risks domain reputation, enables inbox flooding)
- The image upload endpoint does CPU-intensive Sharp processing per request and can be abused to exhaust server resources

## Decisions

- **In-memory fixed-window rate limiter** — no external dependencies, appropriate for a single-process SQLite app
- **Disabled during E2E tests** via `DISABLE_RATE_LIMITING` runtime config flag (same pattern as `ENABLE_TEST_ENDPOINTS`)
- **Trusted proxy** — production runs behind nginx, so client IP is read from `X-Forwarded-For`
- **Standard 429 responses** with `Retry-After` header

## Rate Limits

| Endpoint                       | Key                                                      | Max Requests | Window     |
| ------------------------------ | -------------------------------------------------------- | ------------ | ---------- |
| `/api/auth/sign-in/magic-link` | Client IP (`X-Forwarded-For` → `remoteAddress` fallback) | 5            | 15 minutes |
| `/api/image-upload`            | Authenticated user ID                                    | 10           | 1 minute   |

## Architecture

### `server/utils/rateLimiter.ts`

Factory function that creates independent rate limiter instances:

```typescript
interface RateLimiterOptions {
    maxRequests: number;
    windowMs: number;
}

interface RateLimitResult {
    allowed: boolean;
    retryAfter: number; // seconds until window resets
}

function createRateLimiter(options: RateLimiterOptions): {
    check(key: string): RateLimitResult;
};
```

- **Store:** `Map<string, { count: number, resetAt: number }>`
- **Algorithm:** Fixed window — on first request for a key, create an entry with `resetAt = now + windowMs`. Increment count on each request. If `count > maxRequests` and `now < resetAt`, deny. If `now >= resetAt`, reset the entry.
- **Cleanup:** Lazy eviction — when the map exceeds 1000 entries, prune all entries where `now >= resetAt` to prevent unbounded memory growth.

### `server/middleware/rateLimit.ts`

Nitro server middleware that runs on every request. Creates two limiter instances at module scope:

```typescript
const magicLinkLimiter = createRateLimiter({ maxRequests: 5, windowMs: 15 * 60 * 1000 });
const imageUploadLimiter = createRateLimiter({ maxRequests: 10, windowMs: 60 * 1000 });
```

**Request flow:**

1. If `useRuntimeConfig().disableRateLimiting === true`, return immediately (skip all rate limiting)
2. Extract request path from the event
3. If path matches `/api/auth/sign-in/magic-link`:
    - Extract client IP from `X-Forwarded-For` header (first value), falling back to `event.node.req.socket.remoteAddress`
    - Call `magicLinkLimiter.check(ip)`
    - If not allowed: set status 429, set `Retry-After` header, return `{ message: "Too many requests. Please try again later.", retryAfter }`
4. If path matches `/api/image-upload`:
    - Read `event.context.user` (populated by auth middleware, which runs first alphabetically)
    - If no user, skip (the handler will return 401)
    - Call `imageUploadLimiter.check(userId)`
    - If not allowed: same 429 response

**Middleware ordering:** Nitro loads middleware alphabetically. `auth.ts` runs before `rateLimit.ts`, so `event.context.user` is available for the image upload check.

### Config Changes

**`nuxt.config.ts`** — add to `runtimeConfig`:

```typescript
disableRateLimiting: process.env.DISABLE_RATE_LIMITING === 'true',
```

**`playwright.config.ts`** — add `DISABLE_RATE_LIMITING=true` to the start command:

```
DATABASE_PATH=./data/test.db ENABLE_TEST_ENDPOINTS=true DISABLE_RATE_LIMITING=true npm run start
```

### Existing config cleanup

The `authRateLimit` values in `config/default.json` and `config/test.json` are unused and will not be used by this implementation. They can be removed as part of this work.

## 429 Response Format

```
HTTP/1.1 429 Too Many Requests
Retry-After: 42
Content-Type: application/json

{
    "message": "Too many requests. Please try again later.",
    "retryAfter": 42
}
```

## Testing

### `test/server/rateLimiter.test.ts`

Unit tests for `createRateLimiter`:

- Allows requests up to the limit
- Blocks requests after the limit is reached
- Returns correct `retryAfter` value
- Resets after the window expires (use `vi.useFakeTimers()`)
- Lazy cleanup prunes stale entries when map exceeds threshold

### `test/server/rateLimitMiddleware.test.ts`

Integration tests for the middleware:

- Magic link path returns 429 after 5 requests from the same IP
- Image upload path returns 429 after 10 requests from the same user
- Different IPs/users have independent limits
- 429 response includes `Retry-After` header and correct JSON body
- Middleware skips rate limiting when `disableRateLimiting` is true

### E2E tests

No changes needed — `DISABLE_RATE_LIMITING=true` in the Playwright config disables rate limiting entirely during E2E runs.

## Files to Create/Modify

| File                                      | Action                                                     |
| ----------------------------------------- | ---------------------------------------------------------- |
| `server/utils/rateLimiter.ts`             | Create                                                     |
| `server/middleware/rateLimit.ts`          | Create                                                     |
| `nuxt.config.ts`                          | Modify — add `disableRateLimiting` to runtimeConfig        |
| `playwright.config.ts`                    | Modify — add `DISABLE_RATE_LIMITING=true` to start command |
| `config/default.json`                     | Modify — remove `authRateLimit`                            |
| `config/test.json`                        | Modify — remove `authRateLimit`                            |
| `test/server/rateLimiter.test.ts`         | Create                                                     |
| `test/server/rateLimitMiddleware.test.ts` | Create                                                     |
