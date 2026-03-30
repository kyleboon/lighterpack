# LighterPack

LighterPack helps you track the gear you bring on adventures.

## Tech Stack

- **Framework**: Nuxt 4 (Vue 3, Nitro server, Vite)
- **State**: Pinia
- **Database**: sqlite

## Prerequisites

- Node.js and npm

## Getting Started

1. Clone the repo:

    ```bash
    git clone https://github.com/galenmaly/lighterpack.git
    cd lighterpack
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Start the app in development mode:

    ```bash
    npm run dev
    ```

4. Open http://localhost:3000

## Available Scripts

```bash
npm run dev              # Start dev server with hot reload (Nuxt on :3000)
npm run start            # Production build + start server
npm run build            # Nuxt production build only
npm run lint:js          # ESLint with auto-fix (.js and .vue files)
npm run lint:css         # Stylelint with auto-fix (.scss and .vue files)
npm run test:unit        # Run Vitest unit tests
npm run test:unit:watch  # Run Vitest in watch mode
npm run test:server      # Run server-side integration tests
npm run typecheck        # TypeScript type check (no emit)
```

## Testing

Server-side integration tests use Vitest with an in-memory SQLite database to test API handler authorization and logic directly.

E2E tests use Playwright and run against Chromium and Firefox.

### First-time setup

Install Playwright browsers (only needed once):

```bash
npx playwright install
```

### Running tests

```bash
npx playwright test                                    # Run all E2E tests
npx playwright test test/e2e/auth.spec.ts              # Run a single test file
npx playwright test --project=chromium                 # Run tests in one browser only
npx playwright test --update-snapshots                 # Regenerate screenshot baselines
```

Playwright automatically starts the app server before running tests (via `npm run start`).

## Roadmap

### Deployment related

- [ ] Register new domain name
- [ ] Update branding to use new domain name
- [ ] Create a simple logo and add it to the branding
- [ ] Deploy to VPS
- [ ] Replace email provider (Mailgun)

### High — Should fix before launch

- [ ] Add structured logging (pino or similar) — replace scattered `console.log` calls, add request tracing
- [ ] Standardize error handling on `createError` + throw pattern — only 4 try-catch blocks across 56+ error paths; wrap DB operations, Sharp image processing, and `unlinkSync` calls

### Medium — Should fix shortly after launch

- [ ] Fix silent frontend failures — 15+ `.catch(() => {})` blocks in Pinia store swallow errors without user feedback
- [ ] Add Open Graph and Twitter Card meta tags to share pages (`/r/[id]`) so shared links preview correctly on social media
- [ ] Accessibility: ARIA labels, `role="dialog"` on modals, `alt` text on images, keyboard navigation for drag-drop, focus trapping in modals, skip links
- [ ] Add database backup strategy — automated backups for the SQLite file
- [ ] Add LIMIT to unbounded queries — `buildLibraryBlob()` loads all user data with no bounds
- [ ] Add graceful shutdown handling (SIGTERM handler to close DB connections and drain in-flight requests)
- [ ] Create `.env.example` and deployment documentation (required env vars, secrets management, database setup)
- [ ] Stop using imgur for image uploads (Cloudflare R2, S3, or local storage with CDN and backup strategy)
- [ ] Update the UX to be responsive
- [ ] Remove "popups" and improve the user experience
- [ ] SEO improvements (sitemap, robots.txt, canonical links, structured data)

### Low — Nice to have for v1

- [ ] Standardize error response shapes across all API routes
- [ ] Add request body validation with zod (negative weights, invalid unit values, string length limits)
- [ ] Add missing FK constraint on `library_settings.default_list_id`
- [ ] Split monolithic 829-line Pinia store into modules
- [ ] Add API documentation (OpenAPI spec)
- [ ] Bundle size monitoring in CI (`rollup-plugin-visualizer`)
- [ ] Consider PostgreSQL migration if expecting >100 concurrent users (SQLite single-writer limitation)
- [ ] Add explicit CSRF token validation for sensitive endpoints (DELETE, account operations)
- [ ] Switch to Tailwind and get rid of SCSS
- [ ] Handle decimal display better
- [ ] Define clear rules for "Worn" vs "Consumable" weight
- [ ] Fix disabled WebKit Playwright tests
- [ ] Markdown export along with CSV

### Future features

- [ ] Full TypeScript migration across client and server
- [ ] Route-level code splitting with `defineAsyncComponent`
- [ ] Virtual scrolling for large gear lists (`vue-virtual-scroller`)
- [ ] Implement column sorting
- [ ] Add additional fields (url, notes, condition, calories)
- [ ] Add a "pantry" section for food
