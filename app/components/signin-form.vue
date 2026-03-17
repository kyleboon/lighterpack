<template>
    <form class="signin" @submit.prevent="signin">
        <p v-if="message" class="lpSuccess">
            {{ message }}
        </p>
        <div class="lpFields">
            <input
                v-model="username"
                v-focus-on-create
                type="text"
                placeholder="Username"
                name="username"
                class="username"
            />
            <input
                ref="passwordInput"
                v-model="password"
                type="password"
                placeholder="Password"
                name="password"
                class="password"
            />
        </div>

        <errors :errors="errors_" />

        <div class="lpButtons">
            <button class="lpButton">
                Sign in
                <spinner v-if="fetching" />
            </button>

            <router-link to="/forgot-password" class="lpHref signin-forgot-password">
                Forgot username/password?
            </router-link>
        </div>
    </form>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useLighterpackStore } from '../store/store.js';
import { fetchJson } from '../utils/utils.js';
import errors from './errors.vue';
import spinner from './spinner.vue';

defineOptions({ name: 'SigninForm' });

defineProps({
    message: { type: String, default: null },
});

const store = useLighterpackStore();
const router = useRouter();

const fetching = ref(false);
const errors_ = ref([]);
const username = ref('');
const password = ref('');
const passwordInput = ref(null);

function signin() {
    errors_.value = [];

    if (!username.value) {
        errors_.value.push({ field: 'username', message: 'Please enter a username.' });
    }

    if (!password.value) {
        errors_.value.push({ field: 'password', message: 'Please enter a password.' });
    }

    if (errors_.value.length) {
        return;
    }

    fetching.value = true;

    fetchJson('/signin/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ username: username.value, password: password.value }),
    })
        .then((response) => {
            store.setSyncToken(response.syncToken);
            store.loadLibraryData(response.library);
            store.setSaveType('remote');
            store.setLoggedIn(response.username);
            router.push('/');
            fetching.value = false;
        })
        .catch((err) => {
            errors_.value = err;
            passwordInput.value.focus();
            password.value = '';
            fetching.value = false;
        });
}
</script>
