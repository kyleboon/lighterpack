import { useLighterpackStore } from '~/store/store.js';

export default defineNuxtRouteMiddleware(() => {
    const store = useLighterpackStore();
    if (!store.loggedIn) return navigateTo('/signin');
});
