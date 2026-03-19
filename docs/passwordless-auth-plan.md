# Passwordless Authentication Migration Plan

## Better Auth + Magic Link Plugin

### Overview

Replace the current session/password-based authentication with passwordless authentication using [Better Auth](https://www.better-auth.com) and the magic link plugin. Users will sign in by entering their email address and clicking a link sent to their inbox — no passwords required.

**Current stack:** Nuxt 4 + Nitro + SQLite + Drizzle ORM
**Auth today:** Hand-rolled token-in-cookie scheme (`users.token` column → `lp` httpOnly cookie) with bcrypt password hashing
**Auth after:** Better Auth with Drizzle SQLite adapter + magic link plugin

---

## Step 1 — Dependencies

**Add:**

```
better-auth
```

**Remove (after migration is complete and verified):**

```
bcryptjs
```

Keep `mailgun.js` and `form-data` — Better Auth will call the existing Mailgun client via its `sendMagicLink` hook.

---

## Step 2 — Configuration (`config/default.json`)

Add the following keys:

```json
{
    "betterAuthSecret": "",
    "betterAuthBaseURL": "http://localhost:3000",
    "magicLinkExpiresIn": 300
}
```

- `betterAuthSecret` must be a long random string (32+ characters). Set in `config/local.json` (gitignored) for local dev and via environment variable in production.
- `magicLinkExpiresIn` is in seconds (300 = 5 minutes).

---

## Step 3 — Database Schema (Drizzle Migration)

Better Auth with the Drizzle SQLite adapter requires specific tables. The existing `users` table needs new columns, and three new tables must be added.

### Alter `users` table

Add columns Better Auth expects:

- `name text` — maps to the existing `username` display concept
- `emailVerified integer` — boolean (SQLite stores as 0/1)
- `updatedAt integer` — timestamp

Mark as nullable or drop after cutover:

- `password text` — no longer used
- `token text` — replaced by `session` table

> **Keep `users.id` as `INTEGER AUTOINCREMENT`.** Better Auth defaults to UUID string IDs, but the Drizzle adapter supports custom schema mappings. This must be configured explicitly to avoid breaking the integer FK relationships in `lists`, `categories`, `category_items`, and `library_settings`.

### New tables (required by Better Auth)

| Table          | Purpose                                                            |
| -------------- | ------------------------------------------------------------------ |
| `session`      | Replaces the raw `token` column; Better Auth manages sessions      |
| `account`      | Stores linked auth methods (magic link uses an `email` credential) |
| `verification` | Stores pending magic link tokens until they are clicked            |

Generate the migration with:

```bash
npx drizzle-kit generate
npm run db:migrate
```

---

## Step 4 — Backend Changes

### 4a. Replace `server/utils/auth.ts`

This file becomes the central Better Auth instance. Move `isModerator` to a new `server/utils/moderation.ts` file first, then replace the contents:

```typescript
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import { getDb } from '../db.js';
import * as schema from '../schema.js';
import { sendEmail } from './email.js'; // existing Mailgun wrapper

export const auth = betterAuth({
    database: drizzleAdapter(getDb(), {
        provider: 'sqlite',
        schema: {
            /* map to existing table names */
        },
    }),
    plugins: [
        magicLink({
            sendMagicLink: async ({ email, url }) => {
                await sendEmail({
                    to: email,
                    subject: 'Sign in to LighterPack',
                    text: `Click to sign in: ${url}`,
                });
            },
            expiresIn: 300,
        }),
    ],
    session: {
        cookieCache: { enabled: true },
    },
    trustedOrigins: [
        /* load from config */
    ],
});
```

### 4b. Create `server/api/auth/[...all].ts`

Nitro catch-all route that hands off all `/api/auth/*` requests to Better Auth:

```typescript
import { auth } from '../../utils/auth.js';

export default defineEventHandler((event) => {
    return auth.handler(toWebRequest(event));
});
```

Better Auth will serve these endpoints automatically:

- `POST /api/auth/sign-in/magic-link` — request a magic link
- `GET  /api/auth/magic-link/verify` — verify token from email link
- `POST /api/auth/sign-out` — end session
- `GET  /api/auth/session` — get current session

### 4c. Replace `server/middleware/auth.ts`

Swap the raw `lp` cookie token lookup for Better Auth's session API. The shape of `event.context.user` stays the same so all downstream handlers continue to work unchanged:

```typescript
import { auth } from '../utils/auth.js';

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({ headers: event.headers });
    if (session?.user) {
        event.context.user = await findUserByEmail(session.user.email);
    }
});
```

### 4d. Delete old auth route files

These are fully replaced by the Better Auth catch-all:

- `server/api/auth/signin.post.ts`
- `server/api/auth/register.post.ts`
- `server/api/auth/signout.post.ts`
- `server/api/auth/forgot-password.post.ts`
- `server/api/auth/forgot-username.post.ts`

### 4e. Modify `server/api/account/index.post.ts`

Remove all password-change logic. Keep only the email-change flow.

### 4f. Modify `server/api/account/delete.post.ts`

Remove the `verifyPassword` call and `currentPassword` field. A typed confirmation string (e.g. "delete my account") is sufficient as a second factor for a passwordless app.

---

## Step 5 — Username Strategy

Better Auth's user model has `name` (display name) but not `username`. LighterPack shows "Signed in as {username}" in the UI and uses `username` for moderation. The `users.username` column is kept as a custom field.

**Option A — Prompt on first login (recommended for UX):**
After magic link verification succeeds for a new user, redirect to a `/setup-username` page to collect a username before continuing to the app.

**Option B — Auto-derive from email (simpler):**
On first login, generate a username from the email local part (e.g. `kyle` from `kyle@example.com`). Append a number if taken.

The `server/middleware/auth.ts` continues to populate `event.context.user` with the full `users` row (including `username`), so all downstream handlers that read `user.username` work without changes regardless of which option is chosen.

---

## Step 6 — Frontend Changes

### Components

| File                                | Change                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| `app/components/signin-form.vue`    | Replace with email-only magic link form; show "check your email" confirmation state after submit |
| `app/components/register-form.vue`  | Merge into signin form or repurpose with different copy; both flows are identical                |
| `app/components/account.vue`        | Remove "Current Password" and "New Password" fields; keep "New Email" only                       |
| `app/components/account-delete.vue` | Remove password confirmation field; use typed text confirmation only                             |

### Pages

| File                            | Change                                                                    |
| ------------------------------- | ------------------------------------------------------------------------- |
| `app/pages/forgot-password.vue` | Delete; magic link is the recovery mechanism. Add a redirect to `/signin` |
| `app/pages/signin.vue`          | Update to use the new magic link form component                           |
| `app/pages/register.vue`        | Update to use the magic link form (or redirect to `/signin`)              |

### Store (`app/store/store.js`)

Update the signout action endpoint from the old route to Better Auth's:

```js
// Before
await $fetch('/api/auth/signout', { method: 'POST' });

// After
await $fetch('/api/auth/sign-out', { method: 'POST' });
```

---

## Step 7 — `nuxt.config.ts` Changes

Add Better Auth to Nitro's external dependencies and configure the post-verification callback:

```typescript
nitro: {
  externals: {
    external: ['better-auth'],
  },
},
```

Set `callbackURL: '/'` in the Better Auth config so users land on the main app after clicking their magic link.

---

## Step 8 — Session / Cookie Migration

The current `lp` httpOnly cookie will not be recognized by Better Auth. Existing logged-in users will be logged out when the new system is deployed. They will simply sign in again via magic link.

**If zero-downtime migration is required:**

1. Keep the old token lookup in middleware running alongside Better Auth for one release (dual-read).
2. On a successful old-token auth, issue a Better Auth session and delete the `lp` cookie.
3. Remove the legacy path in the next release.

For a project of this scale, accepting force re-login on deploy is the recommended approach.

---

## Step 9 — Testing

### Unit tests

No existing unit tests cover auth directly. Add a unit test for the new `magic-link-form.vue` component following the pattern in `test/unit/`.

### E2E tests

The biggest challenge: headless tests cannot receive email. Use one of:

**Option A (recommended for CI):** Use Better Auth's test utilities to generate a valid session token programmatically, then set the session cookie directly — bypassing the email flow entirely.

**Option B:** In the test environment, configure the magic link plugin to write tokens to a predictable location (file or env var), and have the test helper navigate to the verification URL directly.

**Files to update:**

| File                               | Action                                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------------- |
| `test/e2e/auth-utils.ts`           | Rewrite `loginUser` and `registerUser` helpers using the chosen test strategy                |
| `test/e2e/auth.spec.ts`            | Remove password tests; rewrite sign-in/register/signout tests; remove "change password" test |
| `test/e2e/forgot-password.spec.ts` | Delete entirely                                                                              |

---

## File-by-File Summary

| File                                      | Action                                                                              |
| ----------------------------------------- | ----------------------------------------------------------------------------------- |
| `package.json`                            | Add `better-auth`; remove `bcryptjs`                                                |
| `config/default.json`                     | Add `betterAuthSecret`, `betterAuthBaseURL`, `magicLinkExpiresIn`                   |
| `server/schema.ts`                        | Add Better Auth columns to `users`; add `session`, `account`, `verification` tables |
| `drizzle/migrations/0001_better_auth.sql` | Create via `drizzle-kit generate`                                                   |
| `server/utils/auth.ts`                    | Replace with Better Auth instance                                                   |
| `server/utils/moderation.ts`              | Create; extract `isModerator` from old `auth.ts`                                    |
| `server/api/auth/[...all].ts`             | Create; Nitro catch-all for Better Auth handler                                     |
| `server/api/auth/signin.post.ts`          | Delete                                                                              |
| `server/api/auth/register.post.ts`        | Delete                                                                              |
| `server/api/auth/signout.post.ts`         | Delete                                                                              |
| `server/api/auth/forgot-password.post.ts` | Delete                                                                              |
| `server/api/auth/forgot-username.post.ts` | Delete                                                                              |
| `server/middleware/auth.ts`               | Replace; use Better Auth session instead of token cookie                            |
| `server/api/account/index.post.ts`        | Modify; remove password change logic                                                |
| `server/api/account/delete.post.ts`       | Modify; remove `verifyPassword` call                                                |
| `app/components/signin-form.vue`          | Replace with email-only magic link form                                             |
| `app/components/register-form.vue`        | Replace or remove                                                                   |
| `app/components/account.vue`              | Remove password fields                                                              |
| `app/components/account-delete.vue`       | Remove password field                                                               |
| `app/pages/forgot-password.vue`           | Delete (redirect to `/signin`)                                                      |
| `app/pages/signin.vue`                    | Update to use magic link form                                                       |
| `app/pages/register.vue`                  | Update or redirect to `/signin`                                                     |
| `app/store/store.js`                      | Update signout endpoint URL                                                         |
| `nuxt.config.ts`                          | Add Better Auth externals; configure callback URL                                   |
| `test/e2e/auth-utils.ts`                  | Rewrite login/register helpers                                                      |
| `test/e2e/auth.spec.ts`                   | Rewrite; remove password tests                                                      |
| `test/e2e/forgot-password.spec.ts`        | Delete                                                                              |

---

## Key Risks

1. **Integer ID vs UUID** — The most complex part. Better Auth defaults to UUID string IDs; the existing schema uses `INTEGER AUTOINCREMENT` with FK relationships across 4 tables. Requires careful configuration of the Drizzle adapter's custom schema mapping before writing any migrations.

2. **Username field** — Not native to Better Auth. Must be preserved as a custom column for moderation and display. New-user flow needs a strategy (Option A or B in Step 5).

3. **E2E test auth flow** — Headless tests cannot click email links. Must implement programmatic session creation or token interception before the E2E suite can pass.
