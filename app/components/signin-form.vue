<template>
    <div>
        <div v-if="emailSent" class="lpSuccess">
            <p>Check your email for a sign-in link. It expires in 5 minutes.</p>
        </div>
        <form v-else class="signin" @submit.prevent="sendMagicLink">
            <div class="lpFields">
                <input
                    v-model="email"
                    v-focus-on-create
                    type="email"
                    placeholder="Email address"
                    name="email"
                    class="email"
                    autocomplete="email"
                />
            </div>

            <errors :errors="errors_" />

            <div class="lpButtons">
                <button class="lpButton">
                    Send sign-in link
                    <spinner v-if="fetching" />
                </button>
            </div>
        </form>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import errors from './errors.vue';
import spinner from './spinner.vue';

defineOptions({ name: 'SigninForm' });

const fetching = ref(false);
const errors_ = ref([]);
const email = ref('');
const emailSent = ref(false);

defineExpose({ email, errors_, emailSent, sendMagicLink });

async function sendMagicLink() {
    errors_.value = [];

    if (!email.value) {
        errors_.value.push({ field: 'email', message: 'Please enter your email address.' });
        return;
    }

    fetching.value = true;
    try {
        await $fetch('/api/auth/sign-in/magic-link', {
            method: 'POST',
            body: { email: email.value, callbackURL: '/' },
        });
        emailSent.value = true;
    } catch (err) {
        errors_.value = [{ message: err?.data?.message || 'An error occurred. Please try again.' }];
    } finally {
        fetching.value = false;
    }
}
</script>
