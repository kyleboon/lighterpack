# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LighterPack is a full-stack web application for tracking gear for adventures. Nuxt 4 full-stack app with Vue 3 SPA frontend, Nitro server backend, SQLite database via Drizzle ORM, and Better Auth for passwordless magic link authentication.

## Common Commands

```bash
npm run dev              # Start dev server with hot reload (Nuxt on :3000)
npm run start            # Production build + start server
npm run build            # Nuxt production build only
npm run lint:js          # ESLint with auto-fix (.js and .vue files)
npm run lint:css         # Stylelint with auto-fix (.scss and .vue files)
npm run test:unit        # Run Vitest unit tests
npm run test:unit:watch  # Run Vitest in watch mode
npm run typecheck        # TypeScript type check (no emit)
npx playwright test                                    # Run all E2E tests
npx playwright test test/e2e/auth.spec.ts              # Run a single test file
npx playwright test --project=chromium                 # Run tests in one browser only
npx playwright test --update-snapshots                 # Regenerate screenshot baselines
```

## Architecture

### Frontend (`app/`)

- **Vue 3.5** SPA with **Pinia** store (`app/store/store.js`, exported as `useLighterpackStore()`)
- Pages in `app/pages/`: `index.vue` (main app), `signin.vue`, `register.vue` (redirects to signin), `welcome.vue`, `r/[id].vue` (share page)
- Components in `app/components/` (~30 `.vue` files)
- Composables in `app/composables/`, utilities in `app/utils/`
- Route middleware `app/middleware/auth.ts` — redirects to `/signin` if not logged in
- Client plugin `app/plugins/session.client.ts` — restores auth state from session cookie on page load
- SCSS styles in `app/assets/css/`

### Shared (`shared/`)

- `shared/dataTypes.js` — data models (Item, Category, List, Library) used by both frontend and backend
- `shared/utils/weight.js`, `shared/utils/color.js` — utility functions
- Aliased as `#shared` in both Nitro and Vite configs

### Backend (`server/`)

- **Nitro** (Nuxt's server engine) — no separate Express app
- API routes in `server/api/`: REST endpoints for library, lists, categories, items, auth, account, image upload, share, and CSV export
- Server middleware `server/middleware/auth.ts` — populates `event.context.user` from Better Auth session on every request
- **SQLite** via **Drizzle ORM** — schema in `server/schema.ts`, db init in `server/db.ts`
- **Better Auth** with magic link plugin — configured in `server/utils/auth.ts`; auth handler at `server/api/auth/[...all].ts`
- `server/api/test/create-user-session.post.ts` — test-only endpoint for programmatic session creation (used by E2E tests)

### Database Schema

Tables: `user`, `session`, `account`, `verification` (Better Auth), plus `library_settings`, `lists`, `categories`, `category_items` (application data). Database file path configured via `databasePath` in config (default: `./data/lighterpack.db`).

### Authentication

Passwordless magic link flow: user enters email → Better Auth sends a magic link via Mailgun → clicking the link creates a session. Registration and sign-in use the same flow — new users get an account created automatically.

When Mailgun is not configured (dev), the magic link URL is logged to the console.

### Configuration

- Uses the `config` npm package. Defaults in `config/default.json`, local overrides in `config/local.json` (gitignored)
- Key config values: `betterAuthSecret`, `betterAuthBaseURL`, `betterAuthTrustedOrigins`, `databasePath`, `mailgunAPIKey`, `mailgunDomain`

### Build System

- **Nuxt 3** with Vite for the frontend and Nitro for the server
- Output to `.output/` — `npm run start` builds then runs `.output/server/index.mjs`
- `routeRules`: `/r/**` uses SSR (share pages), `/**` is SPA (no SSR)

## Code Style

- **4-space indentation** (both JS and SCSS)
- ESLint extends `airbnb-base` + `plugin:vue/recommended`
- Stylelint with alphabetically ordered CSS properties

## Testing

### Unit tests (Vitest)

- Vitest unit tests in `test/unit/` — components, data types, utils, and views
- Pattern: `mount()` from `@vue/test-utils`; use `createPinia()`/`setActivePinia()` for components that access the store; use `vi.useFakeTimers()` for timer-dependent behavior
- Run with `npm run test:unit`

### E2E tests (Playwright)

- Playwright tests in `test/e2e/` — runs against Chromium and Firefox (WebKit disabled)
- Test helpers in `test/e2e/auth-utils.ts` — `loginUser` and `registerUser` create sessions programmatically via `/api/test/create-user-session` (no magic link email required)
- Playwright auto-starts the app via `npm run start` with `DATABASE_PATH=./data/test.db` (`reuseExistingServer: !process.env.CI` — kill stale servers on port 3000 before re-running locally)
- Load testing with Locust (Python) in `test/load-testing/`

## Key Technical Notes

- The sidebar has `z-index: 20` (below `.lpList` at `z-index: 30`) — flyout popovers inside the sidebar are visually trapped behind the main list area. Use `page.evaluate` with `__vue_app__.config.globalProperties.$store` to trigger store actions in E2E tests instead of clicking sidebar flyout buttons.
- `server/middleware/auth.ts` uses `getRequestHeaders` (not `toWebRequest`) to avoid consuming the request body stream before `readBody()` in API handlers.
