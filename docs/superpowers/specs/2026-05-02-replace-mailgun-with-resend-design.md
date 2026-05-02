# Replace Mailgun with Resend

**Issue**: #2 — Replace email provider (Mailgun)
**Date**: 2026-05-02

## Overview

Replace Mailgun with Resend for sending magic link authentication emails. Add an HTML email template with a styled call-to-action button. Simplify config from three Mailgun keys to one Resend API key.

## Changes

### 1. `server/utils/auth.ts` — Email sending

Replace the `sendMagicLinkEmail` function internals:

- Remove `mailgun.js` / `form-data` usage and the `createRequire` import used to load them
- Use the `resend` npm package: `new Resend(apiKey)` → `resend.emails.send()`
- Send both HTML and plain text versions of the email
- Keep the "log to console if no API key" dev behavior unchanged
- From address: `BaseWeight <noreply@baseweight.pro>` (drop the `mg.` subdomain — Resend doesn't require a subdomain)
- Reply-to: `BaseWeight <info@baseweight.pro>` (unchanged)

### 2. HTML Email Template

Simple, inline-styled email (no external CSS, no images to host):

- BaseWeight name at top (text, not an image)
- "Sign in to BaseWeight" heading
- Call-to-action button linking to the magic link URL
- Fallback plain text URL below the button for email clients that don't render buttons
- "This link expires in 5 minutes." note
- Minimal styling: white background, centered card layout, branded button

Plain text fallback remains the same as today:

```
Click the link below to sign in to BaseWeight. This link expires in 5 minutes.

{url}
```

### 3. Config Changes

Replace three Mailgun config keys with one Resend key.

**`config/default.json`** — Remove:

```json
"mailgunDomain": "",
"mailgunBaseURL": "",
"mailgunAPIKey": ""
```

Add:

```json
"resendAPIKey": ""
```

**`config/production.json`** — No change needed (has no email provider keys).

**`docs/deployment.md`** — Update the `local-production.json` example in section 6:

```json
{
    "betterAuthSecret": "<generate-with-openssl-rand-hex-32>",
    "betterAuthBaseURL": "https://baseweight.pro",
    "betterAuthTrustedOrigins": ["https://baseweight.pro"],
    "resendAPIKey": "<your-resend-api-key>"
}
```

### 4. Dependencies

- Add: `resend`
- Remove: `mailgun.js`, `form-data`

### 5. Validation

**`server/plugins/sqlite.ts`** — Update the config validation:

- Change `config.get<string>('mailgunAPIKey')` to `config.get<string>('resendAPIKey')`
- Update warning message from "mailgunAPIKey not set" to "resendAPIKey not set — magic link emails will be logged to console"

### 6. Tests

Update any server tests that reference mailgun config keys to use `resendAPIKey`.

## Out of Scope

- Custom domain verification setup in Resend (handled in Resend dashboard, not in code)
- Email analytics or delivery tracking
- Multiple email templates (only magic link for now)
