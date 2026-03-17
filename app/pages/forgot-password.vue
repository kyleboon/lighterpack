<template>
    <div id="forgotPasswordContainer">
        <modal id="forgotPassword" :shown="true" :blackout="true">
            <div class="columns">
                <div class="lpHalf">
                    <h3>Forgot Your Password?</h3>

                    <p>Please enter your username.</p>
                    <form class="forgotPassword" @submit.prevent="resetPassword">
                        <div class="lpFields">
                            <input
                                v-model="forgotPasswordUsername"
                                type="text"
                                placeholder="Username"
                                name="username"
                                class="username"
                            />
                            <input type="submit" value="Submit" class="lpButton" />
                        </div>

                        <errors :errors="forgotPasswordErrors" />
                    </form>
                </div>
                <div class="lpHalf">
                    <h3>Forgot Your Username?</h3>

                    <p>Please enter your email address.</p>
                    <form class="forgotUsername" @submit.prevent="forgotUsername">
                        <div class="lpFields">
                            <input
                                v-model="forgotUsernameEmail"
                                type="text"
                                placeholder="Email Address"
                                name="email"
                                class="email"
                            />
                            <input type="submit" value="Submit" class="lpButton" />
                        </div>

                        <errors :errors="forgotUsernameErrors" />
                    </form>
                </div>
                <NuxtLink to="/signin" class="lpHref"> &larr; Return to sign in </NuxtLink>
            </div>
        </modal>
        <blackoutFooter />
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { fetchJson } from '../utils/utils.js';

defineOptions({ name: 'ForgotPassword' });

const router = useRouter();

const forgotPasswordUsername = ref('');
const forgotPasswordErrors = ref([]);
const forgotUsernameEmail = ref('');
const forgotUsernameErrors = ref([]);

function resetPassword() {
    forgotPasswordErrors.value = [];

    return fetchJson('/forgotPassword', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ username: forgotPasswordUsername.value }),
    })
        .then((_response) => {
            router.push('/signin/reset-password');
        })
        .catch((response) => {
            let localErrors = [{ message: 'An error occurred, please try again later.' }];
            if (response.json && response.json.errors) {
                localErrors = response.json.errors;
            }
            forgotPasswordErrors.value = localErrors;
        });
}

function forgotUsername() {
    forgotUsernameErrors.value = [];

    return fetchJson('/forgotUsername', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ email: forgotUsernameEmail.value }),
    })
        .then((_response) => {
            router.push('/signin/forgot-username');
        })
        .catch((response) => {
            let localErrors = [{ message: 'An error occurred, please try again later.' }];
            if (response.json && response.json.errors) {
                localErrors = response.json.errors;
            }
            forgotUsernameErrors.value = localErrors;
        });
}
</script>

<style lang="scss">
#forgotPassword {
    width: 620px;
}
</style>
