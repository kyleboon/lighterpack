import { createRouter, createWebHistory } from 'vue-router';
import dashboard from '../app/pages/index.vue';
import welcome from '../app/pages/welcome.vue';
import signin from '../app/pages/signin.vue';
import register from '../app/pages/register.vue';
import forgotPassword from '../app/pages/forgot-password.vue';
import moderation from '../app/pages/moderation.vue';

const routes = [
    { path: '/', component: dashboard },
    { path: '/welcome', component: welcome },
    { path: '/signin', component: signin },
    { path: '/signin/reset-password', component: signin },
    { path: '/signin/forgot-username', component: signin },
    { path: '/register', component: register },
    { path: '/forgot-password', component: forgotPassword },
    { path: '/moderation', component: moderation },
    { path: '/:pathMatch(.*)*', component: dashboard },
];

export default createRouter({
    history: createWebHistory(),
    routes,
});
