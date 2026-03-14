# LighterPack

LighterPack helps you track the gear you bring on adventures.

## Tech Stack

- **Frontend**: Vue 3 SPA with Pinia and Vue Router
- **Backend**: Node.js / Express
- **Database**: MongoDB (via Docker Compose)
- **Build**: Vite

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

## Modernization Roadmap

### Phase 1 — Server async/await + MongoDB driver ✅

- ✅ Replace `mongojs` (archived/unmaintained) with the official `mongodb` driver (v7)
- ✅ Refactor `server/auth.js` and `server/endpoints.js` from callback pyramids to `async/await`
- ✅ Convert `authenticateUser` from continuation-passing callback to Express middleware
- ~~Add `express-async-errors` for centralized error handling~~ (not needed — Express 5 handles async errors natively)
- ✅ Remove `body-parser` dependency (built into Express 5)
- ✅ Upgrade `markdown@0.5.0` (from 2012) to `marked@14.x`
- ✅ Add security hardening: `helmet`, `express-rate-limit` on auth endpoints, `httpOnly` + `sameSite` cookie attributes

### Phase 2 — Code quality ✅

- ✅ Add Prettier + `husky` + `lint-staged` for consistent formatting and pre-commit enforcement
- ✅ Enable stricter ESLint rules: `no-shadow`, `no-param-reassign`, `consistent-return`
- ✅ Add GitHub Actions CI (lint + E2E tests on every push/PR)
- Add Vitest + `@vue/test-utils` for unit and component tests
- Add `tsconfig.json` with strict mode; enable `@ts-check` in existing JS files
- Enable `vue/require-prop-types` and `vue/require-explicit-emits` in ESLint

### Phase 3 — Composition API + remove legacy patterns (4–8 weeks)

- Convert all ~30 components from Options API to Composition API with `<script setup>`
- Remove `window.bus` event emitter and `mixins/utils-mixin.js` — replace with composables
- Remove `window.router`, `window.fetchJson` global namespace pollution
- Replace `dragula` with `SortableJS` or `vue-draggable-next` (TypeScript support, actively maintained)
- Remove `lodash` dependency — use native `Object.assign()` and `debounce`
- Convert `client/dataTypes.js` from `.prototype` function constructors to ES6 `class` syntax; replace `var` and loose equality

### Phase 4 — Full TypeScript + performance + accessibility (ongoing)

- Full TypeScript migration across client and server
- Route-level code splitting with `defineAsyncComponent`
- Virtual scrolling for large gear lists (`vue-virtual-scroller`)
- Accessibility: ARIA labels, keyboard navigation for drag-drop, skip links
- Bundle analysis with `rollup-plugin-visualizer`
- Fix disabled WebKit Playwright tests
