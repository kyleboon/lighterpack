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
npm run typecheck        # TypeScript type check (no emit)
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

Playwright automatically starts the app server before running tests (via `npm run start`).

## Roadmap

- Switch to tailwind and get rid of scss
- Remove "popups" and improve the user experience
- Update the UX to be responsive
- Accessibility: ARIA labels, keyboard navigation for drag-drop, skip links

- Full TypeScript migration across client and server
- Route-level code splitting with `defineAsyncComponent`
- Virtual scrolling for large gear lists (`vue-virtual-scroller`)
- Bundle analysis with `rollup-plugin-visualizer`
- Fix disabled WebKit Playwright tests
- Replace email provider
- Handle decimal display better
- Stop using imgur for image uploads (cloudflare? and maybe a local storage option)
- Implement column sorting and bulk selection.
- Define clear rules for "Worn" vs "Consumable" weight.
- Add additional fields (url, notes, condition, multiple images, calories)
- Add a "pantry" section for food
- Better support for copying a pack
- deploy to vps
- give option for self hosting - maybe
- SEO improvements
- **Replace embed widget with iframe**: Replace the current embed endpoint with a simple `<iframe src="/r/:id?embed=true">` pointing at the SSR share page. Zero script injection on the host page, no CSS conflicts, impossible to break. (is embedding even a good idea?)
- markdown export along with csv
