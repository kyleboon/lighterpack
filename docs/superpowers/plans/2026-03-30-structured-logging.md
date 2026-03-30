# Structured Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace scattered `console.log` calls with structured pino logging and add automatic per-request tracing with `X-Request-Id` headers.

**Architecture:** Single pino logger instance in `server/utils/logger.ts` provides structured JSON logging (pretty-printed in dev). A new middleware (`server/middleware/00-request-logger.ts`) generates request IDs, creates per-request child loggers, and automatically logs request/response pairs. All existing `console.*` calls in `server/` are replaced with pino equivalents.

**Tech Stack:** pino, pino-pretty (dev), Node.js `crypto.randomUUID()`, H3 event context

**Spec:** `docs/superpowers/specs/2026-03-30-structured-logging-design.md`

---

### Task 1: Install Dependencies and Add Config

**Files:**

- Modify: `package.json`
- Modify: `config/default.json`

- [ ] **Step 1: Install pino and pino-pretty**

Run:

```bash
npm install pino && npm install --save-dev pino-pretty
```

- [ ] **Step 2: Add logLevel to config/default.json**

In `config/default.json`, add `"logLevel": "info"` after the `"magicLinkExpiresIn"` line:

```json
    "magicLinkExpiresIn": 300,
    "logLevel": "info"
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json config/default.json
git commit -m "chore: add pino dependencies and logLevel config"
```

---

### Task 2: Create Logger Module with Tests

**Files:**

- Create: `server/utils/logger.ts`
- Create: `test/server/logger.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `test/server/logger.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('logger', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('defaults to info level when no env var or config override', async () => {
        delete process.env.LOG_LEVEL;
        vi.doMock('config', () => ({
            default: {
                has: (key: string) => key === 'logLevel',
                get: (key: string) => {
                    if (key === 'logLevel') return 'info';
                    return '';
                },
            },
        }));

        const { logger } = await import('../../server/utils/logger.js');
        expect(logger.level).toBe('info');
    });

    it('uses LOG_LEVEL env var when set', async () => {
        process.env.LOG_LEVEL = 'debug';
        vi.doMock('config', () => ({
            default: {
                has: (key: string) => key === 'logLevel',
                get: (key: string) => {
                    if (key === 'logLevel') return 'info';
                    return '';
                },
            },
        }));

        const { logger } = await import('../../server/utils/logger.js');
        expect(logger.level).toBe('debug');
    });

    it('uses config logLevel when env var is not set', async () => {
        delete process.env.LOG_LEVEL;
        vi.doMock('config', () => ({
            default: {
                has: (key: string) => key === 'logLevel',
                get: (key: string) => {
                    if (key === 'logLevel') return 'warn';
                    return '';
                },
            },
        }));

        const { logger } = await import('../../server/utils/logger.js');
        expect(logger.level).toBe('warn');
    });

    it('falls back to info when config has no logLevel key', async () => {
        delete process.env.LOG_LEVEL;
        vi.doMock('config', () => ({
            default: {
                has: () => false,
                get: () => {
                    throw new Error('not found');
                },
            },
        }));

        const { logger } = await import('../../server/utils/logger.js');
        expect(logger.level).toBe('info');
    });

    it('exports createChildLogger that returns a child with bindings', async () => {
        delete process.env.LOG_LEVEL;
        vi.doMock('config', () => ({
            default: {
                has: (key: string) => key === 'logLevel',
                get: (key: string) => {
                    if (key === 'logLevel') return 'info';
                    return '';
                },
            },
        }));

        const { createChildLogger } = await import('../../server/utils/logger.js');
        const child = createChildLogger({ module: 'db' });
        expect(child).toBeDefined();
        expect(typeof child.info).toBe('function');
        expect(typeof child.error).toBe('function');
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:server`

Expected: FAIL — `server/utils/logger.js` does not exist.

- [ ] **Step 3: Create the logger module**

Create `server/utils/logger.ts`:

```typescript
import pino from 'pino';
import config from 'config';

function resolveLevel(): string {
    if (process.env.LOG_LEVEL) {
        return process.env.LOG_LEVEL;
    }
    if (config.has('logLevel')) {
        return config.get<string>('logLevel');
    }
    return 'info';
}

function createLogger(): pino.Logger {
    const level = resolveLevel();

    if (process.env.NODE_ENV !== 'production') {
        return pino({
            level,
            transport: {
                target: 'pino-pretty',
                options: { colorize: true },
            },
        });
    }

    return pino({ level });
}

export const logger = createLogger();

export function createChildLogger(bindings: pino.Bindings): pino.Logger {
    return logger.child(bindings);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:server`

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add server/utils/logger.ts test/server/logger.spec.ts
git commit -m "feat: add pino logger module with configurable log level"
```

---

### Task 3: Add Request Tracing Middleware with Tests

**Files:**

- Create: `server/middleware/00-request-logger.ts`
- Create: `test/server/requestLogger.spec.ts`

The `00-` prefix ensures Nitro runs this middleware before `auth.ts`, `rateLimit.ts`, and `securityHeaders.ts` (Nitro sorts middleware alphabetically).

- [ ] **Step 1: Write the failing tests**

Create `test/server/requestLogger.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub Nitro globals
(globalThis as any).defineEventHandler = (fn: Function) => fn;
(globalThis as any).getRequestHeader = (event: any, name: string) => {
    return event._requestHeaders?.[name.toLowerCase()];
};
(globalThis as any).setResponseHeader = (event: any, name: string, value: string) => {
    event._responseHeaders = event._responseHeaders || {};
    event._responseHeaders[name] = value;
};
(globalThis as any).getRequestURL = (event: any) => {
    return new URL(event._url || 'http://localhost/api/test', 'http://localhost');
};

describe('request logger middleware', () => {
    let handler: Function;

    beforeEach(async () => {
        vi.resetModules();
        // Mock the logger module to avoid pino-pretty transport issues in tests
        vi.doMock('../../server/utils/logger.js', () => {
            const childFn = {
                info: vi.fn(),
                warn: vi.fn(),
                error: vi.fn(),
                debug: vi.fn(),
                child: vi.fn(),
            };
            return {
                logger: {
                    child: vi.fn(() => childFn),
                    info: vi.fn(),
                },
                createChildLogger: vi.fn(() => childFn),
            };
        });
        const mod = await import('../../server/middleware/00-request-logger.js');
        handler = mod.default;
    });

    function createEvent(overrides: Record<string, any> = {}) {
        const listeners: Record<string, Function[]> = {};
        return {
            _requestHeaders: overrides.requestHeaders || {},
            _responseHeaders: {} as Record<string, string>,
            _url: overrides.url || 'http://localhost/api/library',
            context: {} as Record<string, any>,
            node: {
                req: { method: overrides.method || 'GET' },
                res: {
                    statusCode: 200,
                    on: (eventName: string, fn: Function) => {
                        listeners[eventName] = listeners[eventName] || [];
                        listeners[eventName].push(fn);
                    },
                },
            },
            _listeners: listeners,
        };
    }

    it('generates a requestId when X-Request-Id header is absent', async () => {
        const event = createEvent();
        await handler(event);
        expect(event.context.requestId).toBeDefined();
        expect(typeof event.context.requestId).toBe('string');
        expect(event.context.requestId.length).toBeGreaterThan(0);
    });

    it('reuses X-Request-Id header when present', async () => {
        const event = createEvent({
            requestHeaders: { 'x-request-id': 'my-custom-id-123' },
        });
        await handler(event);
        expect(event.context.requestId).toBe('my-custom-id-123');
    });

    it('sets X-Request-Id response header', async () => {
        const event = createEvent();
        await handler(event);
        expect(event._responseHeaders['X-Request-Id']).toBe(event.context.requestId);
    });

    it('attaches a child logger to event.context.logger', async () => {
        const event = createEvent();
        await handler(event);
        expect(event.context.logger).toBeDefined();
        expect(typeof event.context.logger.info).toBe('function');
    });

    it('logs request complete on response finish with statusCode and durationMs', async () => {
        const event = createEvent();
        await handler(event);
        const finishCallbacks = event._listeners['finish'];
        expect(finishCallbacks).toBeDefined();
        expect(finishCallbacks.length).toBe(1);

        // Simulate response finish
        finishCallbacks[0]();
        expect(event.context.logger.info).toHaveBeenCalledWith(
            expect.objectContaining({
                statusCode: 200,
                durationMs: expect.any(Number),
            }),
            'request complete',
        );
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:server`

Expected: FAIL — `server/middleware/00-request-logger.js` does not exist.

- [ ] **Step 3: Create the request logger middleware**

Create `server/middleware/00-request-logger.ts`:

```typescript
import { logger } from '../utils/logger.js';
import type { Logger } from 'pino';

declare module 'h3' {
    interface H3EventContext {
        requestId: string;
        logger: Logger;
    }
}

export default defineEventHandler((event) => {
    const requestId = getRequestHeader(event, 'x-request-id') || crypto.randomUUID();
    const method = event.node.req.method || 'UNKNOWN';
    const url = getRequestURL(event);
    const path = url.pathname;

    event.context.requestId = requestId;

    const childLogger = logger.child({ requestId, method, path });
    event.context.logger = childLogger;

    setResponseHeader(event, 'X-Request-Id', requestId);

    childLogger.info('request start');

    const start = performance.now();
    event.node.res.on('finish', () => {
        const durationMs = Math.round(performance.now() - start);
        childLogger.info({ statusCode: event.node.res.statusCode, durationMs }, 'request complete');
    });
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:server`

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add server/middleware/00-request-logger.ts test/server/requestLogger.spec.ts
git commit -m "feat: add request tracing middleware with X-Request-Id"
```

---

### Task 4: Replace console.\* Calls in server/db.ts

**Files:**

- Modify: `server/db.ts`

- [ ] **Step 1: Replace all console calls with pino logger**

In `server/db.ts`, add the import at the top (after the existing imports):

```typescript
import { createChildLogger } from './utils/logger.js';

const log = createChildLogger({ module: 'db' });
```

Then replace each `console.*` call:

Replace `console.log('[db] migrationsFolder:', migrationsFolder);` with:

```typescript
log.debug({ migrationsFolder }, 'migrations folder');
```

Replace `console.log('[db] migration files:', readdirSync(migrationsFolder));` with:

```typescript
log.debug({ files: readdirSync(migrationsFolder) }, 'migration files');
```

Replace `console.log('[db] could not read migrations folder:', e);` with:

```typescript
log.warn({ err: e }, 'could not read migrations folder');
```

Replace `console.log('[db] migrations complete');` with:

```typescript
log.info('migrations complete');
```

Replace `console.error('[db] migration error:', e);` with:

```typescript
log.error({ err: e }, 'migration error');
```

Replace `console.log({ message: 'SQLite database initialized', path: dbPath });` with:

```typescript
log.info({ path: dbPath }, 'database initialized');
```

The final file should look like:

```typescript
import { createRequire } from 'module';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { resolve } from 'path';
import { readdirSync } from 'node:fs';
import * as schema from './schema.js';
import { createChildLogger } from './utils/logger.js';

const log = createChildLogger({ module: 'db' });

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
    if (!_db) throw new Error('Database not initialized. Call initDb() first.');
    return _db;
}

export function initDb(dbPath: string) {
    const _require = createRequire(process.argv[1]);
    const BetterSqlite3 = _require('better-sqlite3') as typeof import('better-sqlite3');

    const migrationsFolder = resolve(process.cwd(), 'drizzle/migrations');
    log.debug({ migrationsFolder }, 'migrations folder');
    try {
        log.debug({ files: readdirSync(migrationsFolder) }, 'migration files');
    } catch (e) {
        log.warn({ err: e }, 'could not read migrations folder');
    }

    const sqlite = new BetterSqlite3(dbPath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('synchronous = NORMAL');
    sqlite.pragma('foreign_keys = ON');
    sqlite.pragma('busy_timeout = 5000');
    sqlite.pragma('cache_size = -20000');
    sqlite.pragma('temp_store = MEMORY');

    _db = drizzle(sqlite, { schema });
    try {
        migrate(_db, { migrationsFolder });
        log.info('migrations complete');
    } catch (e) {
        log.error({ err: e }, 'migration error');
        throw e;
    }

    log.info({ path: dbPath }, 'database initialized');
    return _db;
}
```

- [ ] **Step 2: Run existing tests to verify nothing breaks**

Run: `npm run test:server`

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add server/db.ts
git commit -m "refactor: replace console calls with pino logger in db module"
```

---

### Task 5: Replace console.\* Calls in Remaining Server Files

**Files:**

- Modify: `server/plugins/sqlite.ts`
- Modify: `server/utils/auth.ts`
- Modify: `server/api/account/delete.post.ts`

- [ ] **Step 1: Replace console.warn in server/plugins/sqlite.ts**

Add the import at the top of `server/plugins/sqlite.ts`:

```typescript
import { logger } from '../utils/logger.js';
```

Replace `console.warn('[config] mailgunAPIKey is not set — magic link emails will be logged to console instead of sent');` with:

```typescript
logger.warn('mailgunAPIKey not set — magic link emails will be logged to console');
```

The final file:

```typescript
import config from 'config';
import { initDb } from '../db.js';
import { logger } from '../utils/logger.js';

function validateConfig() {
    const required = ['betterAuthSecret', 'betterAuthBaseURL', 'betterAuthTrustedOrigins'];
    const missing = required.filter((key) => {
        const value = config.get(key);
        if (Array.isArray(value)) return value.length === 0;
        return !value;
    });

    if (missing.length) {
        throw new Error(`Missing required config values: ${missing.join(', ')}`);
    }

    if (!config.get<string>('mailgunAPIKey')) {
        logger.warn('mailgunAPIKey not set — magic link emails will be logged to console');
    }
}

export default defineNitroPlugin(() => {
    validateConfig();
    const dbPath = process.env.DATABASE_PATH ?? config.get<string>('databasePath') ?? './data/lighterpack.db';
    initDb(dbPath);
});
```

- [ ] **Step 2: Replace console.log in server/utils/auth.ts**

Add the import at the top of `server/utils/auth.ts` (after the existing imports):

```typescript
import { logger } from '../utils/logger.js';
```

Wait — `auth.ts` is inside `server/utils/` so the import is a sibling:

```typescript
import { logger } from './logger.js';
```

Replace `console.log({ message: 'Mailgun not configured — magic link URL:', url });` with:

```typescript
logger.info({ url }, 'Mailgun not configured — magic link URL');
```

- [ ] **Step 3: Replace console.log in server/api/account/delete.post.ts**

This handler has access to `event.context.logger` from the request tracing middleware. No import needed.

Replace `console.log({ message: 'Completed account delete', email: user.email });` with:

```typescript
event.context.logger.info({ email: user.email }, 'account deleted');
```

The final file:

```typescript
import { eq } from 'drizzle-orm';
import { getDb } from '../../db.js';
import * as schema from '../../schema.js';

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        setResponseStatus(event, 401);
        return { message: 'Please log in.' };
    }

    const body = await readBody(event);

    if (body.email !== user.email) {
        setResponseStatus(event, 400);
        return { errors: [{ field: 'email', message: 'Email does not match your account.' }] };
    }

    const db = getDb();
    await db.delete(schema.user).where(eq(schema.user.id, user.id));

    event.context.logger.info({ email: user.email }, 'account deleted');
    return { message: 'success' };
});
```

- [ ] **Step 4: Run all tests to verify nothing breaks**

Run: `npm run test:server && npm run test:unit`

Expected: All tests PASS.

- [ ] **Step 5: Verify no console.log/warn/error calls remain in server/**

Run: `grep -rn 'console\.\(log\|warn\|error\)' server/`

Expected: No output (zero remaining calls).

- [ ] **Step 6: Commit**

```bash
git add server/plugins/sqlite.ts server/utils/auth.ts server/api/account/delete.post.ts
git commit -m "refactor: replace remaining console calls with pino logger"
```

---

### Task 6: Manual Verification

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

Expected: Startup logs appear in colored, human-readable format via pino-pretty. You should see structured output for "migrations complete", "database initialized", and (if mailgun is not configured) the mailgun warning.

- [ ] **Step 2: Make a request and verify request tracing**

In another terminal, run:

```bash
curl -v http://localhost:3000/api/health
```

Expected in the dev server output:

- A "request start" log line with `requestId`, `method: "GET"`, `path: "/api/health"`
- A "request complete" log line with `requestId`, `statusCode: 200`, `durationMs`
- Both lines share the same `requestId`

Expected in the curl response headers:

- `X-Request-Id` header is present with a UUID value

- [ ] **Step 3: Verify X-Request-Id passthrough**

```bash
curl -v -H "X-Request-Id: test-trace-123" http://localhost:3000/api/health
```

Expected:

- The response `X-Request-Id` header is `test-trace-123`
- The server logs show `requestId: "test-trace-123"`

- [ ] **Step 4: Run the full test suite one final time**

```bash
npm run test:unit && npm run test:server
```

Expected: All tests PASS.
