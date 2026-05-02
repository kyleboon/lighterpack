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
