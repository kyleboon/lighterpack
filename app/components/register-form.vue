<template>
    <form class="lpRegister lpFields" @submit.prevent="submit">
        <div class="lpFields">
            <input v-model="username" v-focus-on-create type="text" placeholder="Username" name="username" />
            <input v-model="email" type="email" placeholder="Email" name="email" />
            <input v-model="password" type="password" placeholder="Password" name="password" />
            <input v-model="passwordConfirm" type="password" placeholder="Confirm password" name="passwordConfirm" />
        </div>
        <errors :errors="errors_" />
        <div class="lpButtons">
            <button class="lpButton">
                Register
                <spinner v-if="saving" />
            </button>
            <a class="lpHref lpGetStarted" @click="loadLocal">Skip registration</a>
        </div>
    </form>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useLighterpackStore } from '../store/store.js';
import { fetchJson } from '../utils/utils.js';
import dataTypes from '../../shared/dataTypes.js';
import errors from './errors.vue';
import spinner from './spinner.vue';

defineOptions({ name: 'RegisterForm' });

const Library = dataTypes.Library;

const store = useLighterpackStore();
const router = useRouter();

const username = ref('');
const email = ref('');
const password = ref('');
const passwordConfirm = ref('');
const saving = ref(false);
const errors_ = ref([]);

const isLocalSaving = computed(() => store.saveType === 'local');

function loadLocal() {
    if (isLocalSaving.value) {
        router.push('/');
        return;
    }
    const library = new Library();
    store.loadLibraryData(JSON.stringify(library.save()));
    store.setSaveType('local');
    store.setLoggedIn(false);
    router.push('/');
}

function submit() {
    errors_.value = [];

    if (!username.value) {
        errors_.value.push({ field: 'username', message: 'Please enter a username.' });
    }

    if (username.value && (username.value.length < 3 || username.value.length > 32)) {
        errors_.value.push({
            field: 'username',
            message: 'Please enter a username between 3 and 32 characters.',
        });
    }

    if (!email.value) {
        errors_.value.push({ field: 'email', message: 'Please enter an email.' });
    }

    if (!password.value) {
        errors_.value.push({ field: 'password', message: 'Please enter a password.' });
    }

    if (!passwordConfirm.value) {
        errors_.value.push({ field: 'passwordConfirm', message: 'Please enter a password confirmation.' });
    }

    if (password.value && passwordConfirm.value && password.value !== passwordConfirm.value) {
        errors_.value.push({ field: 'password', message: "Your passwords don't match." });
    }

    if (password.value && (password.value.length < 5 || password.value.length > 60)) {
        errors_.value.push({
            field: 'password',
            message: 'Please enter a password between 5 and 60 characters.',
        });
    }

    if (errors_.value.length) {
        return;
    }

    const registerData = { username: username.value, email: email.value, password: password.value };

    if (localStorage.library) {
        registerData.library = localStorage.library;
    }

    saving.value = true;
    fetchJson('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify(registerData),
    })
        .then((response) => {
            store.setSyncToken(response.syncToken);
            store.loadLibraryData(response.library);
            store.setSaveType('remote');
            store.setLoggedIn(response.username);

            if (registerData.library) {
                localStorage.registeredLibrary = localStorage.library;
                delete localStorage.library;
            }
            saving.value = false;
            router.push('/');
        })
        .catch((err) => {
            saving.value = false;
            errors_.value = err;
        });
}
</script>

<style lang="scss"></style>
