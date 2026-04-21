import { useBaseweightStore } from '~/store/store';

export default defineNuxtRouteMiddleware(() => {
    const store = useBaseweightStore();
    if (!store.loggedIn) return navigateTo('/welcome');
});
