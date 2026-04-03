import { useLighterpackStore } from '~/store/store';

export default defineNuxtPlugin((nuxtApp) => {
    const store = useLighterpackStore();
    nuxtApp.vueApp.config.globalProperties.$store = store;
});
