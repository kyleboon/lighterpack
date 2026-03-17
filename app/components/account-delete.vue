<template>
    <modal id="deleteAccount" :shown="shown" @hide="shown = false">
        <h2>Delete account?</h2>

        <form id="accountForm" @submit.prevent="deleteAccount()">
            <p class="lpWarning">
                <strong>This action is permanent and cannot be undone.</strong>
            </p>
            <p>
                If you want to delete your account, please enter your current password and the text
                <strong>delete my account</strong>:
            </p>
            <div class="lpFields">
                <input
                    v-model="currentPassword"
                    type="password"
                    placeholder="Current password"
                    name="currentPassword"
                    class="currentPassword"
                />

                <input v-model="confirmationText" type="text" name="confirmationText" placeholder="Confirmation text" />
            </div>

            <errors :errors="errors_" />

            <div class="lpButtons">
                <input
                    type="submit"
                    value="Permanently delete account"
                    :class="{ lpButton: true, lpButtonDisabled: !isConfirmationComplete }"
                />
                <a class="lpHref" @click="shown = false">Cancel</a>
            </div>
        </form>
    </modal>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useLighterpackStore } from '../store/store.js';
import { fetchJson } from '../utils/utils.js';
import errors from './errors.vue';
import modal from './modal.vue';

defineOptions({ name: 'AccountDelete' });

const store = useLighterpackStore();
const router = useRouter();

const deleting = ref(false);
const errors_ = ref([]);
const confirmationText = ref('');
const currentPassword = ref('');

const isConfirmationComplete = computed(() => confirmationText.value.toLocaleLowerCase() === 'delete my account');

const shown = computed({
    get: () => store.activeModal === 'deleteAccount',
    set: (val) => {
        if (!val) store.closeModal();
    },
});

function deleteAccount() {
    errors_.value = [];

    if (!currentPassword.value) {
        errors_.value.push({ field: 'currentPassword', message: 'Please enter your current password.' });
    }

    if (!isConfirmationComplete.value) {
        errors_.value.push({ field: 'confirmationText', message: 'Please enter the confirmation text.' });
    }

    if (errors_.value.length) {
        return;
    }

    fetchJson('/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ username: store.loggedIn, password: currentPassword.value }),
    })
        .then((_response) => {
            deleting.value = false;
            store.signout();
            router.push('/signin');
        })
        .catch((err) => {
            errors_.value = err;
            deleting.value = false;
        });
}
</script>

<style lang="scss">
#deleteAccount {
    width: 400px;
}
</style>
