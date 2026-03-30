# Structured Logging with Pino + Request Tracing

**Date:** 2026-03-30
**Status:** Approved

## Goal

Replace scattered `console.log` calls with structured JSON logging via pino. Add per-request tracing with a unique request ID propagated through all log lines and returned in a response header.

## Architecture

Single pino logger instance created in `server/utils/logger.ts`, imported wherever needed on the server side. A request-logging middleware generates request IDs and logs request/response pairs automatically. No changes to frontend or shared client-side code.

## Components

### 1. Logger Setup — `server/utils/logger.ts`

- Creates a pino instance exported as `logger`
- Log level resolution order: `LOG_LEVEL` env var → `logLevel` config key → `"info"` default
- In non-production (`NODE_ENV !== 'production'`): uses `pino-pretty` transport for colored, human-readable output
- In production: standard ndjson output
- Exports a `createChildLogger(bindings)` helper for adding context (e.g., `{ module: 'db' }`)

### 2. Request Tracing Middleware — `server/middleware/request-logger.ts`

- Runs on every request, before the existing auth middleware (alphabetical ordering or explicit numbering ensures this)
- Checks for incoming `X-Request-Id` header; if absent, generates one via `crypto.randomUUID()`
- Stores `requestId` on `event.context.requestId`
- Creates a pino child logger bound with `{ requestId, method, path }` and stores it on `event.context.logger`
- Logs request start at `info` level: `{ msg: 'request start', method, path, requestId }`
- Uses `event.node.res.on('finish', ...)` to log response completion: `{ msg: 'request complete', method, path, requestId, statusCode, durationMs }`
- Sets `X-Request-Id` response header on the response

### 3. Replace All Server-Side `console.*` Calls

| File                                          | Current                                                    | Replacement                                                                          |
| --------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `server/db.ts` (line 24)                      | `console.log('[db] migrationsFolder:', ...)`               | `logger.debug({ migrationsFolder }, 'migrations folder')`                            |
| `server/db.ts` (line 26)                      | `console.log('[db] migration files:', ...)`                | `logger.debug({ files }, 'migration files')`                                         |
| `server/db.ts` (line 28)                      | `console.log('[db] could not read migrations folder:', e)` | `logger.warn({ err: e }, 'could not read migrations folder')`                        |
| `server/db.ts` (line 42)                      | `console.log('[db] migrations complete')`                  | `logger.info('migrations complete')`                                                 |
| `server/db.ts` (line 44)                      | `console.error('[db] migration error:', e)`                | `logger.error({ err: e }, 'migration error')`                                        |
| `server/db.ts` (line 48)                      | `console.log({ message: '...', path })`                    | `logger.info({ path: dbPath }, 'database initialized')`                              |
| `server/plugins/sqlite.ts` (line 17)          | `console.warn('[config] mailgunAPIKey...')`                | `logger.warn('mailgunAPIKey not set — magic link emails will be logged to console')` |
| `server/utils/auth.ts` (line 15)              | `console.log({ message: '...', url })`                     | `logger.info({ url }, 'Mailgun not configured — magic link URL')`                    |
| `server/api/account/delete.post.ts` (line 22) | `console.log({ message: '...', email })`                   | `event.context.logger.info({ email }, 'account deleted')`                            |

### 4. Config Change — `config/default.json`

Add `"logLevel": "info"` to the existing config object.

### 5. Dependencies

- `pino` — production dependency
- `pino-pretty` — dev dependency

### 6. TypeScript Augmentation

Augment the H3 `EventContext` type so that `event.context.requestId` (string) and `event.context.logger` (pino.Logger) are typed. Add this in the middleware file or a dedicated `server/types.d.ts`.

## What Does NOT Change

- `shared/dataTypes.js` — the `console.warn` there runs client-side, not part of server logging
- No frontend code changes
- No log aggregation, external transports, or log rotation — those are deployment concerns
- No changes to existing test infrastructure (logger writes to stdout; tests are unaffected)

## Testing

- Add a unit test for the logger module verifying level selection: env var > config > default
- Existing server integration tests continue to work unchanged
- Manual verification: start dev server, make requests, confirm logs include `requestId`, `method`, `path`, `statusCode`, `durationMs` in structured format
