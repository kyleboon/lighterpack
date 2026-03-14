import { createApp } from 'vue';
import { createPinia } from 'pinia';
import mitt from 'mitt';

import './css/lighterpack.scss';
import 'dragula/dist/dragula.css';
import App from './App.vue';
import router from './routes';
import { useLighterpackStore, setupAutoSave } from './store/store';

import { registerDirectives as focusDirectives } from './utils/focus.js';
import { displayWeight, displayPrice } from './utils/utils.js';

// Set up global event bus (mitt replaces Vue 2 event bus)
const emitter = mitt();
window.bus = {
    $on: (event, handler) => emitter.on(event, handler),
    $off: (event, handler) => emitter.off(event, handler),
    $emit: (event, data) => emitter.emit(event, data),
};

bus.$on('unauthorized', () => {
    window.location = '/signin';
});

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);

// Register global directives
focusDirectives(app);

// Expose store as $store global property (preserves this.$store in Options API components)
const store = useLighterpackStore();
app.config.globalProperties.$store = store;
setupAutoSave(store);

// Expose display helpers globally for use in templates
app.config.globalProperties.$displayWeight = displayWeight;
app.config.globalProperties.$displayPrice = displayPrice;

// Keep window.router for legacy global access
window.router = router;

store
    .init()
    .then(() => {
        app.mount('#lp');
    })
    .catch(() => {
        if (!store.library) {
            router.push('/welcome');
        }
        app.mount('#lp');
    });
