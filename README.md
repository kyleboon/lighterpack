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
npm run dev              # Start dev server with hot reload (Vite on :5173)
npm run start            # Production build + start server
npm run build            # Vite production build only
npm run lint:js          # ESLint with auto-fix (.js and .vue files)
npm run lint:css         # Stylelint with auto-fix (.scss and .vue files)
npm run test:unit        # Run Vitest unit tests
npm run test:unit:watch  # Run Vitest in watch mode
npm run test:unit:coverage  # Run Vitest with V8 coverage report
npm run typecheck            # TypeScript type check (no emit)
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
- ✅ Add Vitest + `@vue/test-utils` for unit and component tests
- ✅ Add `tsconfig.json` with strict mode; enable `@ts-check` in existing JS files
- ✅ Enable `vue/require-prop-types` and `vue/require-explicit-emits` in ESLint
- ✅ Expand Playwright E2E test coverage:
    - ✅ `items.spec.ts` — add/edit/delete items and categories; mark worn/consumable; verify weight totals
    - ✅ `list-management.spec.ts` — create, switch, copy, and delete lists
    - ✅ `list-settings.spec.ts` — toggle unit system and column visibility; change currency
    - ✅ `share.spec.ts` — share page shows correct data without login; donut chart renders
    - ✅ `import-csv.spec.ts` — import valid CSV; handle malformed CSV gracefully
    - ✅ `export-import.spec.ts` — export CSV and verify it round-trips cleanly via import
    - ✅ `auth-errors.spec.ts` — wrong password, duplicate username, mismatched passwords
    - ✅ `forgot-password.spec.ts` — unknown username/email error handling

### Phase 3 — Composition API + remove legacy patterns ✅

- ✅ Convert all 31 components and 6 views from Options API to `<script setup>` Composition API
- ✅ Remove `window.bus` event emitter — replaced with Pinia store state and direct router navigation
- ✅ Remove `window.router`, `window.fetchJson` global namespace pollution
- ✅ Remove `lodash` dependency — replaced with native equivalents
- ✅ Remove jQuery — replaced with vanilla JS in share page and embed widget
- ✅ Remove `mixins/utils-mixin.js` — inlined into consuming components
- ✅ Replace `dragula` with `SortableJS`; extract `useItemDrag` composable (TypeScript support, actively maintained)
- ✅ Convert `client/dataTypes.js` from `.prototype` function constructors to ES6 `class` syntax; replace `var` and loose equality
- ✅ Add unit tests for all converted components, views, and data types (43 test files, 315 tests)

### Phase 4 — Full TypeScript + performance + accessibility (ongoing)

- Full TypeScript migration across client and server
- Route-level code splitting with `defineAsyncComponent`
- Virtual scrolling for large gear lists (`vue-virtual-scroller`)
- Accessibility: ARIA labels, keyboard navigation for drag-drop, skip links
- Bundle analysis with `rollup-plugin-visualizer`
- Fix disabled WebKit Playwright tests

### Phase 5 — Modernize share/embed pages

The share and embed pages are currently rendered server-side using Mustache templates and a parallel set of render functions in `server/views.js`. This duplicates logic already in Vue components (weight formatting, unit select widget, etc.).

- **Vue SSR for share page**: Replace Mustache templates and `server/views.js` render functions with `@vue/server-renderer`. Render the existing `share.vue` component server-side so the share page is generated from the same component tree as the main app. Eliminates `t_itemShare.mustache`, `t_categoryShare.mustache`, `t_totals.mustache`, `t_CategorySummary.mustache`, `t_unitSelect.mustache`, and the parallel render functions in `server/views.js`.
- **Replace embed widget with iframe**: Replace the current `embed.jmustache` / `embed.mustache` two-template system (which injects escaped HTML inside a JS file) with a simple `<iframe src="/r:id?embed=true">` pointing at the SSR share page. Zero script injection on the host page, no CSS conflicts, impossible to break.
- **Delete `server/chart-svg.js`**: Once the share page uses the Vue `donut-chart.vue` component via SSR, the standalone SVG renderer used only by the share page can be removed.
