LighterPack
===========
LighterPack helps you track the gear you bring on adventures.

## Tech Stack

- **Frontend**: Vue.js 2 SPA with Vuex and Vue Router
- **Backend**: Node.js / Express
- **Database**: MongoDB (via Docker Compose)
- **Build**: Webpack 5

## Prerequisites

- Node.js and npm
- Docker and Docker Compose (for MongoDB)

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

3. Start MongoDB via Docker Compose:
   ```bash
   docker compose up -d
   ```

4. Start the app in development mode:
   ```bash
   npm run dev
   ```

5. Open http://localhost:8080

## Available Scripts

```bash
npm run dev          # Start dev server with hot reload (webpack dev server on :8080)
npm run start        # Production build + start server
npm run build        # Webpack production build only
npm run lint:js      # ESLint with auto-fix (.js and .vue files)
npm run lint:css     # Stylelint with auto-fix (.scss and .vue files)
```

## Testing

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

Playwright automatically starts the app server before running tests (via `npm run start`). MongoDB must be running via Docker Compose first.

## Future Initiatives

- Migrate from MongoDB/mongojs to PostgreSQL document store
- Update MongoDB driver from legacy mongojs to official mongodb npm package
