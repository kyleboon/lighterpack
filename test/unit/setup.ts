import { config } from '@vue/test-utils';
import { vi } from 'vitest';

// Stub Nuxt auto-imported composables and macros so unit tests
// can import pages/components without a full Nuxt context.
const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    currentRoute: { value: { path: '/', params: {}, query: {} } },
};

const mockRoute = { path: '/', params: {}, query: {}, meta: {} };

(globalThis as any).useRouter = vi.fn(() => mockRouter);
(globalThis as any).useRoute = vi.fn(() => mockRoute);
(globalThis as any).navigateTo = vi.fn();
(globalThis as any).definePageMeta = vi.fn();
(globalThis as any).defineNuxtRouteMiddleware = vi.fn((fn: Function) => fn);

// Register NuxtLink as a stub component globally
config.global.stubs = {
    ...config.global.stubs,
    NuxtLink: {
        template: '<a><slot /></a>',
        props: ['to'],
    },
};
