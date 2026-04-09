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
- [ ] Add database backup strategy — automated backups for the SQLite file
- [ ] Create `.env.example` and deployment documentation (required env vars, secrets management, database setup)

### Front End Ux Work

- [x] Accessibility: ARIA labels, `role="dialog"` on modals, `alt` text on images, keyboard navigation for drag-drop, focus trapping in modals, skip links
- [ ] Update the UX to be responsive

### Code quality / type safety

- [ ] Replace the pragmatic `UNLOADED_LIBRARY` cast in `app/store/store.ts` with a proper nullable type (`library: LibraryType | null`) and add real `if (!this.library) return;` guards at the top of each action. The current pattern is a type-assertion workaround: all actions assume `library` is loaded because the UI only renders them in that state, but there is no static guarantee. A proper refactor would surface missing guards as compile errors.
- [ ] Set up `@typescript-eslint` fully (rules, plugin, project-aware parsing) so `.ts` files in `app/`, `server/`, and `shared/` are linted with type information, not just test files.

### Future features

- [ ] Implement column sorting
- [ ] Add additional fields (notes, condition, calories)
- [ ] Add a "pantry" section for food
- [ ] Markdown export along with CSV
