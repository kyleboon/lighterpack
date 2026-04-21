import { createRequire } from 'module';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import config from 'config';
import { getDb } from '../db.js';
import * as schema from '../schema.js';
import { initNewUserLibrary } from './library.js';
import { logger } from './logger.js';

const _require = createRequire(import.meta.url);

async function sendMagicLinkEmail(email: string, url: string) {
    const mailgunKey = config.get<string>('mailgunAPIKey');
    if (!mailgunKey) {
        logger.info({ url }, 'Mailgun not configured — magic link URL');
        return;
    }
    const FormData = _require('form-data');
    const Mailgun = _require('mailgun.js');
    const mg = new Mailgun(FormData).client({ username: 'api', key: mailgunKey });
    await mg.messages.create(config.get('mailgunDomain'), {
        from: 'BaseWeight <noreply@mg.baseweight.pro>',
        to: email,
        'h:Reply-To': 'BaseWeight <info@baseweight.pro>',
        subject: 'Sign in to BaseWeight',
        text: `Click the link below to sign in to BaseWeight. This link expires in 5 minutes.\n\n${url}`,
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
