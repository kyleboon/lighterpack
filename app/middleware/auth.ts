import { useLighterpackStore } from '~/store/store';

export default defineNuxtRouteMiddleware(() => {
    const store = useLighterpackStore();
    if (!store.loggedIn) return navigateTo('/welcome');
});
