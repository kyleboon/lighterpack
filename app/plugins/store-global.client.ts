import { useBaseweightStore } from '~/store/store';

export default defineNuxtPlugin((nuxtApp) => {
    const store = useBaseweightStore();
    nuxtApp.vueApp.config.globalProperties.$store = store;
});
