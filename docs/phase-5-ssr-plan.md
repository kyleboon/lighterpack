# Phase 5 & 6 — Migrate to Nuxt 4 + SQLite

## Motivation

The current stack has four separate concerns to maintain:

| Current                                | Problem                                        |
| -------------------------------------- | ---------------------------------------------- |
| Vite + custom multi-entry config       | Hand-rolled build pipeline                     |
| Vue Router (manual)                    | Manual route definition + auth guards          |
| Express + `server/views.js` + Mustache | A second server framework just for share pages |
| MongoDB + Docker                       | Requires Docker for local dev                  |

Nuxt 4 is built on top of Vue 3 + Vite + Nitro. It's not adding a technology — it's consolidating these four into one. SSR for share pages falls out naturally; it's just how Nuxt works.

SQLite (via Drizzle ORM) removes the Docker dependency entirely for local dev. The current data model (library stored as a JSON blob per user) maps directly to a SQLite table with a JSON column — no schema redesign required in Phase 6.

---

## What Carries Over Unchanged

- All 31 Vue 3 `<script setup>` components
- Pinia store logic (Nuxt 4 has first-class Pinia support via `@pinia/nuxt`)
- `shared/dataTypes.js`, `shared/utils/weight.js`, `shared/utils/color.js` (move to `shared/`)
- All Playwright E2E tests
- All Vitest unit tests
- Auth cookie strategy (`lp` httpOnly cookie)
- The auto-save debounce logic in the Pinia store

---

## Nuxt 4 Directory Layout

```
project-root/
  app/
    components/        ← client/components/ (unchanged .vue files)
    pages/             ← replaces client/routes.js + client/views/
      index.vue        ← dashboard
      welcome.vue
      signin.vue
      register.vue
      forgot-password.vue
      moderation.vue
      r/
        [id].vue       ← share page (SSR, no JS required)
    layouts/
      default.vue      ← wraps authenticated pages
    plugins/
      auto-save.client.ts   ← setupAutoSave (client-only plugin)
    store/
      store.js         ← Pinia store (unchanged)
    utils/             ← fetchJson, etc.
    assets/css/        ← client/css/
    app.vue
  server/
    api/               ← replaces server/endpoints.js
      auth/
        signin.post.ts
        signout.post.ts
        register.post.ts
        forgot-password.post.ts
        forgot-username.post.ts
      library/
        save.post.ts   ← /saveLibrary
      account/
        index.post.ts
        delete.post.ts
      external-id.post.ts
      image-upload.post.ts
    middleware/        ← authenticateUser becomes a Nitro middleware
      auth.ts
    utils/
      db.ts            ← database connection
      auth.ts          ← verifyPassword, cookie handling
  shared/
    dataTypes.js       ← moved from client/dataTypes.js
    utils/
      weight.js        ← moved from client/utils/
      color.js         ← moved from client/utils/
  public/              ← static assets (unchanged)
  nuxt.config.ts
```

---

## Phase 5 — Migrate to Nuxt 4

### Step 1 — Install Nuxt 4 and init config

```bash
npm install nuxt@^4 @pinia/nuxt
```

Create `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
    modules: ['@pinia/nuxt'],
    ssr: true,
    routeRules: {
        '/r/**': { ssr: true }, // share pages always SSR
        '/**': { ssr: false }, // SPA for authenticated app
    },
    css: ['~/assets/css/app.scss'],
});
```

`routeRules` is the key: the main app stays SPA (no server round-trip for navigation), while share pages are SSR. This replaces the multi-entry Vite setup cleanly.

Delete: `vite.config.js`, `webpack.config.js`, `webpack.development.config.js`, `client/lighterpack.js` (entry point), `client/routes.js`.

### Step 2 — Move shared code to `shared/`

Move and update imports:

- `client/dataTypes.js` → `shared/dataTypes.js`
- `client/utils/weight.js` → `shared/utils/weight.js`
- `client/utils/color.js` → `shared/utils/color.js`

Nuxt 4's `shared/` directory is auto-imported on both client and server. No import path changes needed inside the files themselves — Nuxt resolves them via aliases.

### Step 3 — Move Vue components to `app/components/`

Direct move, no changes:

```
client/components/ → app/components/
client/css/        → app/assets/css/
client/directives/ → app/plugins/directives.ts (register in a plugin)
```

### Step 4 — Convert views to `app/pages/`

Replace `client/views/*.vue` + `client/routes.js` with file-based pages:

| Old                                | New                             |
| ---------------------------------- | ------------------------------- |
| `client/views/dashboard.vue`       | `app/pages/index.vue`           |
| `client/views/welcome.vue`         | `app/pages/welcome.vue`         |
| `client/views/signin.vue`          | `app/pages/signin.vue`          |
| `client/views/register.vue`        | `app/pages/register.vue`        |
| `client/views/forgot-password.vue` | `app/pages/forgot-password.vue` |
| `client/views/moderation.vue`      | `app/pages/moderation.vue`      |

The catch-all route (`/:pathMatch(.*)*` → dashboard) becomes `app/pages/[...slug].vue` that renders the dashboard component.

Route guards (redirect to signin if not logged in) move from the store into `app/middleware/auth.ts`:

```ts
export default defineNuxtRouteMiddleware(() => {
    const store = useLighterpackStore();
    if (!store.loggedIn) return navigateTo('/signin');
});
```

Apply it per-page with `definePageMeta({ middleware: 'auth' })`.

### Step 5 — Share page as SSR page (`app/pages/r/[id].vue`)

This replaces `server/views.js` Mustache rendering AND the old Phase 5 Vue SSR bundle plan. The share page is a Nuxt page with `ssr: true` (set via `routeRules`).

The page uses `useAsyncData` to fetch the library server-side:

```vue
<script setup>
const route = useRoute();
const { data: shareData } = await useAsyncData('share', () => $fetch(`/api/share/${route.params.id}`));
</script>
```

Create `server/api/share/[id].get.ts` that queries the DB and returns the library data. The page component renders it using the same `shared/dataTypes.js` classes and `shared/utils/` that the server already uses.

The donut chart on the share page reuses `app/components/donut-chart.vue` — Nuxt handles SSR compatibility automatically via `<ClientOnly>` wrapper if needed, or the component renders its SVG paths server-side since the math is pure.

This eliminates: all 8 Mustache template files in `templates/`, `server/chart-svg.js`, and the custom SSR bundle build step from the old Phase 5 plan.

### Step 6 — Convert API endpoints to Nitro

Replace `server/endpoints.js` Express routes with Nitro API routes. Each maps directly:

| Express route          | Nitro file                                |
| ---------------------- | ----------------------------------------- |
| `POST /register`       | `server/api/auth/register.post.ts`        |
| `POST /signin`         | `server/api/auth/signin.post.ts`          |
| `POST /signout`        | `server/api/auth/signout.post.ts`         |
| `POST /saveLibrary`    | `server/api/library/save.post.ts`         |
| `POST /externalId`     | `server/api/external-id.post.ts`          |
| `POST /forgotPassword` | `server/api/auth/forgot-password.post.ts` |
| `POST /forgotUsername` | `server/api/auth/forgot-username.post.ts` |
| `POST /account`        | `server/api/account/index.post.ts`        |
| `POST /delete-account` | `server/api/account/delete.post.ts`       |
| `POST /imageUpload`    | `server/api/image-upload.post.ts`         |

Authentication middleware (`authenticateUser`) becomes a Nitro route middleware in `server/middleware/auth.ts` that sets `event.context.user`.

Nitro route format example:

```ts
// server/api/library/save.post.ts
export default defineEventHandler(async (event) => {
    const user = event.context.user; // set by auth middleware
    const body = await readBody(event);
    // ... same logic as Express handler
    return { message: 'success', syncToken: user.syncToken };
});
```

Delete: `server/endpoints.js`, `server/auth.js` (logic moves to `server/utils/auth.ts`), `server/views.js`, `server/app.js`, `app.js`.

### Step 7 — Update the Pinia store

Two changes:

1. Remove the `router` import from `store.js` — use Nuxt's `useRouter()` composable inside action functions instead
2. Move `setupAutoSave` to `app/plugins/auto-save.client.ts` so it only runs on the client

The `init()` action's `fetch('/signin', { method: 'POST' })` pattern for checking session becomes a `useAsyncData` call in `app/layouts/default.vue` or `app.vue`.

Everything else in the store is unchanged.

### Step 8 — Delete the old server

```
rm -rf server/app.js app.js server/endpoints.js server/auth.js server/views.js
rm -rf server/moderation-endpoints.js
rm -rf templates/
rm server/chart-svg.js
```

Remove npm packages: `express`, `mustache`, `compression`, `morgan`, `cookie-parser`, `express-rate-limit`, `helmet` (Nuxt/Nitro has equivalents built in or as modules).

Keep: `bcryptjs`, `mongodb` (Phase 5), `mailgun.js`, `axios`, `formidable`, `config`.

---

## Phase 6 — Replace MongoDB with SQLite + Drizzle

### Why SQLite

- Zero infrastructure: no Docker, no connection string, just a file
- `better-sqlite3` is synchronous — simpler code than async MongoDB driver
- Drizzle ORM gives type-safe queries and migrations
- If traffic ever outgrows SQLite (unlikely for this app), Drizzle supports PostgreSQL with minimal schema changes

### Schema

The current data model is one JSON blob per user. Keep that approach for Phase 6 — no need to normalize the library into relational tables. The schema is:

```ts
// shared/schema.ts (Drizzle)
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('username').notNull().unique(),
    email: text('email').notNull(),
    password: text('password').notNull(), // bcrypt hash
    token: text('token'), // session cookie value
    library: text('library').notNull(), // JSON blob (same as today)
    syncToken: integer('sync_token').notNull().default(0),
    externalIds: text('external_ids'), // JSON array
});
```

This is a direct 1:1 mapping of the current MongoDB document shape. No data migration complexity.

### Migration steps

1. Add `drizzle-orm`, `better-sqlite3`, `drizzle-kit`
2. Create `shared/schema.ts` (above)
3. Generate initial migration: `npx drizzle-kit generate`
4. Write a one-time migration script: export MongoDB → insert into SQLite
5. Update `server/utils/db.ts` to use Drizzle instead of the MongoDB driver
6. Update each API route to use Drizzle queries instead of `getDb().collection('users').find(...)`
7. Remove `mongodb` driver and `config/` DB connection config

MongoDB queries map simply:

| MongoDB                    | Drizzle/SQLite                                                |
| -------------------------- | ------------------------------------------------------------- |
| `users.find({ username })` | `db.select().from(users).where(eq(users.username, username))` |
| `users.updateOne(...)`     | `db.update(users).set(...).where(...)`                        |
| `users.deleteOne(...)`     | `db.delete(users).where(...)`                                 |

Delete: `server/db.js`, `mongodb` npm package, Docker Compose file (or keep it commented as an option for PostgreSQL later).

---

## Implementation Order

### Phase 5 — Do these in sequence, committing after each

1. Move `shared/` files, update all imports — no behavior change
2. Install Nuxt 4, create `nuxt.config.ts` — run existing tests to verify
3. Convert `app/pages/` — verify routing works
4. Convert API endpoints one at a time — verify with E2E tests after each
5. Convert share page to `app/pages/r/[id].vue` — run share E2E tests
6. Delete old Express server files
7. Remove old npm packages

### Phase 6 — After Phase 5 is stable

1. Add Drizzle, create schema, generate migration
2. Write MongoDB → SQLite data migration script
3. Swap `server/utils/db.ts` — run full E2E suite
4. Remove MongoDB driver
5. Remove Docker Compose

---

## Key Questions Still Open

- **Session handling**: The current `lp` cookie is a random token looked up in the DB. Nuxt has `nuxt-auth` module (wraps Auth.js) as an alternative. Simpler to keep the current token strategy and implement it in Nitro middleware — avoids adding another dependency.
- **Mailgun / forgot password**: Keep as-is, just move to a Nitro API route.
- **Moderation endpoints**: Small surface area — convert alongside the other API routes in Phase 5, Step 4.
- **Config management**: The `config` npm package (default.json / local.json) can be replaced with Nuxt's built-in `runtimeConfig` in `nuxt.config.ts`. One less dependency.
- **`localStorage` / local-only mode**: The current app supports using LighterPack without an account via `localStorage`. This works fine in Nuxt as a client-side-only feature. No changes needed — the `init()` store action already handles this branch.
