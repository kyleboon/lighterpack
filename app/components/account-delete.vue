<template>
    <modal id="deleteAccount" :shown="shown" label-id="account-delete-dialog-title" @hide="shown = false">
        <h2 id="account-delete-dialog-title">Delete account?</h2>

        <form id="accountForm" @submit.prevent="deleteAccount()">
            <p class="lpWarning">
                <strong>This action is permanent and cannot be undone.</strong>
            </p>
            <p>
                To confirm, please enter your email address
                <strong>{{ currentEmail }}</strong
                >:
            </p>
            <div class="lpFields">
                <input v-model="confirmEmail" type="email" name="confirmEmail" placeholder="Your email address" />
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
import { useLighterpackStore } from '../store/store';
import { fetchJson } from '../utils/utils';
import errors from './errors.vue';
import modal from './modal.vue';

defineOptions({ name: 'AccountDelete' });

const store = useLighterpackStore();
const router = useRouter();

const errors_ = ref([]);
const confirmEmail = ref('');

const currentEmail = computed(() => store.loggedIn);
const isConfirmationComplete = computed(
    () => confirmEmail.value.trim().toLowerCase() === (currentEmail.value || '').toLowerCase(),
);

const shown = computed({
    get: () => store.activeModal === 'deleteAccount',
    set: (val) => {
        if (!val) store.closeModal();
    },
});

defineExpose({ shown, currentEmail, isConfirmationComplete, confirmEmail, errors_, deleteAccount });

function deleteAccount() {
    errors_.value = [];

    if (!isConfirmationComplete.value) {
        errors_.value.push({ field: 'confirmEmail', message: 'Email does not match your account.' });
        return;
    }

    fetchJson('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: currentEmail.value }),
    })
        .then((_response) => {
            store.signout();
            router.push('/welcome');
        })
        .catch((err) => {
            errors_.value = err;
        });
}
</script>

<style>
#deleteAccount {
    width: 400px;
}
</style>
