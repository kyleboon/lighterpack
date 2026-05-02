# Replace Mailgun with Resend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Mailgun with Resend for sending magic link authentication emails, add an HTML email template, and simplify config from three Mailgun keys to one Resend API key.

**Architecture:** Swap the `sendMagicLinkEmail` function in `server/utils/auth.ts` from `mailgun.js`/`form-data` to the `resend` package. Add an HTML email template as a function in `server/utils/magicLinkEmail.ts`. Update config keys and deployment docs.

**Tech Stack:** `resend` npm package, inline HTML email template, `config` npm package

---

### Task 1: Swap npm dependencies

Remove `mailgun.js` and `form-data`, add `resend`.

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Remove old packages and add new one**

```bash
npm uninstall mailgun.js form-data && npm install resend
```

- [ ] **Step 2: Verify package.json**

Run: `grep -E "resend|mailgun|form-data" package.json`
Expected: only `"resend"` appears in dependencies

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: replace mailgun.js and form-data with resend"
```

---

### Task 2: Update config keys

Replace the three Mailgun config keys with a single `resendAPIKey`.

**Files:**

- Modify: `config/default.json`
- Modify: `server/plugins/sqlite.ts:17-19`

- [ ] **Step 1: Update `config/default.json`**

Remove these three lines:

```json
"mailgunDomain": "",
"mailgunBaseURL": "",
"mailgunAPIKey": "",
```

Add this line in the same location:

```json
"resendAPIKey": "",
```

The result should look like (preserving surrounding keys):

```json
{
    "environment": "development",
    "deployUrl": "http://localhost:3000",
    "publicUrl": "http://localhost:3000",
    "port": 3000,
    "devServerPort": 8080,
    "bindings": [""],
    "databaseUrl": "mongodb://localhost:27017/baseweight",
    "databasePath": "./data/baseweight.db",
    "uploadsPath": "./data/uploads",
    "maxImageSizeMb": 10,
    "imageMaxWidthPx": 1200,
    "resendAPIKey": "",
    "betterAuthSecret": "",
    "betterAuthBaseURL": "http://localhost:3000",
    "betterAuthTrustedOrigins": ["http://localhost:*", "http://127.0.0.1:*"],
    "magicLinkExpiresIn": 300,
    "logLevel": "info",
    "maxItemsPerUser": 1000
}
```

- [ ] **Step 2: Update validation in `server/plugins/sqlite.ts`**

Change the mailgun warning (lines 17-19) from:

```typescript
if (!config.get<string>('mailgunAPIKey')) {
    logger.warn('mailgunAPIKey not set — magic link emails will be logged to console');
}
```

To:

```typescript
if (!config.get<string>('resendAPIKey')) {
    logger.warn('resendAPIKey not set — magic link emails will be logged to console');
}
```

- [ ] **Step 3: Verify the app still starts**

Run: `npm run build`
Expected: build succeeds with no errors

- [ ] **Step 4: Commit**

```bash
git add config/default.json server/plugins/sqlite.ts
git commit -m "chore: replace mailgun config keys with resendAPIKey"
```

---

### Task 3: Create HTML email template

Create a dedicated file for the magic link email template that exports functions to generate both HTML and plain text versions.

**Files:**

- Create: `server/utils/magicLinkEmail.ts`

- [ ] **Step 1: Create `server/utils/magicLinkEmail.ts`**

```typescript
export function magicLinkHtml(url: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign in to BaseWeight</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 8px; padding: 40px;">
                    <tr>
                        <td style="text-align: center; padding-bottom: 24px;">
                            <span style="font-size: 24px; font-weight: 700; color: #18181b;">BaseWeight</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center; padding-bottom: 16px;">
                            <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #18181b;">Sign in to BaseWeight</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center; padding-bottom: 32px;">
                            <p style="margin: 0; font-size: 15px; color: #52525b; line-height: 1.5;">Click the button below to sign in. This link expires in 5 minutes.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center; padding-bottom: 24px;">
                            <a href="${url}" style="display: inline-block; padding: 12px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 6px;">Sign in</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center; padding-bottom: 8px;">
                            <p style="margin: 0; font-size: 13px; color: #a1a1aa;">Or copy and paste this link into your browser:</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">
                            <p style="margin: 0; font-size: 13px; color: #2563eb; word-break: break-all;">${url}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

export function magicLinkText(url: string): string {
    return `Click the link below to sign in to BaseWeight. This link expires in 5 minutes.\n\n${url}`;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run typecheck`
Expected: no new type errors

- [ ] **Step 3: Commit**

```bash
git add server/utils/magicLinkEmail.ts
git commit -m "feat: add HTML magic link email template"
```

---

### Task 4: Replace Mailgun with Resend in auth.ts

Swap the email sending implementation from Mailgun to Resend.

**Files:**

- Modify: `server/utils/auth.ts`

- [ ] **Step 1: Replace `server/utils/auth.ts`**

Replace the entire file contents with:

```typescript
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import config from 'config';
import { Resend } from 'resend';
import { getDb } from '../db.js';
import * as schema from '../schema.js';
import { initNewUserLibrary } from './library.js';
import { logger } from './logger.js';
import { magicLinkHtml, magicLinkText } from './magicLinkEmail.js';

async function sendMagicLinkEmail(email: string, url: string) {
    const resendKey = config.get<string>('resendAPIKey');
    if (!resendKey) {
        logger.info({ url }, 'Resend not configured — magic link URL');
        return;
    }
    const resend = new Resend(resendKey);
    await resend.emails.send({
        from: 'BaseWeight <noreply@baseweight.pro>',
        replyTo: 'BaseWeight <info@baseweight.pro>',
        to: email,
        subject: 'Sign in to BaseWeight',
        html: magicLinkHtml(url),
        text: magicLinkText(url),
    });
}

function createAuth() {
    return betterAuth({
        baseURL: config.get<string>('betterAuthBaseURL'),
        secret: config.get<string>('betterAuthSecret'),
        trustedOrigins: config.get<string[]>('betterAuthTrustedOrigins'),
        database: drizzleAdapter(getDb(), {
            provider: 'sqlite',
            schema: {
                user: schema.user,
                session: schema.session,
                account: schema.account,
                verification: schema.verification,
            },
        }),
        plugins: [
            magicLink({
                sendMagicLink: async ({ email, url }) => {
                    await sendMagicLinkEmail(email, url);
                },
                expiresIn: config.get<number>('magicLinkExpiresIn'),
                disableSignUp: false,
            }),
        ],
        databaseHooks: {
            user: {
                create: {
                    after: async (user) => {
                        await initNewUserLibrary(user.id);
                    },
                },
            },
        },
    });
}

let _auth: ReturnType<typeof createAuth> | null = null;

export function getAuth() {
    if (!_auth) _auth = createAuth();
    return _auth;
}

// Backwards-compatible named export for callers that import `auth` directly.
export const auth = new Proxy({} as ReturnType<typeof createAuth>, {
    get(_target, prop) {
        return (getAuth() as any)[prop];
    },
});
```

Key changes from the original:

- Removed `import { createRequire } from 'module'` (was only needed for mailgun.js CommonJS require)
- Removed `const _require = createRequire(import.meta.url)`
- Added `import { Resend } from 'resend'`
- Added imports for `magicLinkHtml` and `magicLinkText`
- Replaced `mailgunAPIKey` config check with `resendAPIKey`
- Replaced Mailgun client with `new Resend(resendKey)` and `resend.emails.send()`
- Updated log message from "Mailgun not configured" to "Resend not configured"
- Added `html` and `text` fields, added `replyTo` field
- Removed `mg.` subdomain from `from` address

- [ ] **Step 2: Verify it compiles**

Run: `npm run typecheck`
Expected: no new type errors

- [ ] **Step 3: Run all tests**

Run: `npm run test:unit && npm run test:server`
Expected: all tests pass (no tests directly reference mailgun)

- [ ] **Step 4: Commit**

```bash
git add server/utils/auth.ts
git commit -m "feat: replace Mailgun with Resend for magic link emails"
```

---

### Task 5: Update deployment documentation

Update the deployment guide and spec to reference Resend instead of Mailgun.

**Files:**

- Modify: `docs/deployment.md:129-154`
- Modify: `docs/superpowers/specs/2026-04-24-vps-deployment-design.md`

- [ ] **Step 1: Update `docs/deployment.md` section 6**

Replace the `local-production.json` example (lines 137-145) from:

```json
{
    "betterAuthSecret": "<generate-with-openssl-rand-hex-32>",
    "betterAuthBaseURL": "https://baseweight.pro",
    "betterAuthTrustedOrigins": ["https://baseweight.pro"],
    "mailgunAPIKey": "<your-mailgun-api-key>",
    "mailgunDomain": "mg.baseweight.pro",
    "mailgunBaseURL": "https://api.mailgun.net"
}
```

With:

```json
{
    "betterAuthSecret": "<generate-with-openssl-rand-hex-32>",
    "betterAuthBaseURL": "https://baseweight.pro",
    "betterAuthTrustedOrigins": ["https://baseweight.pro"],
    "resendAPIKey": "<your-resend-api-key>"
}
```

Replace the note after the code block (line 154) from:

```
If you don't have Mailgun configured yet, omit the `mailgunAPIKey`, `mailgunDomain`, and `mailgunBaseURL` fields. Magic link URLs will be logged to the server console instead of emailed.
```

With:

```
If you don't have Resend configured yet, omit the `resendAPIKey` field. Magic link URLs will be logged to the server console instead of emailed.
```

- [ ] **Step 2: Update the VPS deployment spec**

In `docs/superpowers/specs/2026-04-24-vps-deployment-design.md`, find the `local-production.json` example and replace it with the same updated version (remove mailgun keys, add resendAPIKey).

- [ ] **Step 3: Commit**

```bash
git add docs/deployment.md docs/superpowers/specs/2026-04-24-vps-deployment-design.md
git commit -m "docs: update deployment guide for Resend instead of Mailgun"
```

---

### Task 6: Final verification

- [ ] **Step 1: Verify no mailgun references remain in source code**

Run: `grep -r "mailgun\|form-data" --include="*.ts" --include="*.js" --include="*.json" --include="*.md" --exclude-dir=node_modules --exclude-dir=.output --exclude-dir=.nuxt --exclude-dir=.worktrees . | grep -v package-lock | grep -v "plans/\|specs/" | grep -v CHANGELOG`

Expected: no matches (plan/spec files may mention "Mailgun" for historical context — that's fine)

- [ ] **Step 2: Verify build succeeds**

Run: `npm run build`
Expected: build succeeds

- [ ] **Step 3: Verify all tests pass**

Run: `npm run test:unit && npm run test:server`
Expected: all tests pass

- [ ] **Step 4: Verify `resend` is in dependencies and `mailgun.js`/`form-data` are gone**

Run: `grep -E "resend|mailgun|form-data" package.json`
Expected: only `"resend"` line appears
