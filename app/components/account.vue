<template>
    <modal id="accountSettings" :shown="shown" @hide="shown = false">
        <h2>Account Settings</h2>

        <form id="accountForm" @submit.prevent="updateAccount()">
            <div class="lpFields">
                <input type="text" name="username" class="username" disabled :value="username" />
                <input
                    v-model="currentPassword"
                    type="password"
                    placeholder="Current Password"
                    name="currentPassword"
                    class="currentPassword"
                />
                <hr />
                <input v-model="newEmail" type="email" placeholder="New Email" name="newEmail" class="newEmail" />
                <hr />
                <input
                    v-model="newPassword"
                    type="password"
                    placeholder="New Password"
                    name="newPassword"
                    class="newPassword"
                />
                <input
                    v-model="confirmNewPassword"
                    type="password"
                    placeholder="Confirm New Password"
                    name="confirmNewPassword"
                    class="confirmNewPassword"
                />
            </div>

            <errors :errors="errors_" />

            <div class="lpButtons">
                <button class="lpButton">
                    Submit
                    <spinner v-if="saving" />
                </button>
                <a class="lpHref" @click="shown = false">Cancel</a>
                <a class="lpHref" @click="showDeleteAccount">Delete account</a>
            </div>
        </form>
    </modal>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useLighterpackStore } from '../store/store.js';
import { fetchJson } from '../utils/utils.js';
import errors from './errors.vue';
import modal from './modal.vue';
import spinner from './spinner.vue';

defineOptions({ name: 'Account' });

const store = useLighterpackStore();

const saving = ref(false);
const errors_ = ref([]);
const currentPassword = ref('');
const newEmail = ref('');
const newPassword = ref('');
const confirmNewPassword = ref('');

const username = computed(() => store.loggedIn);
const shown = computed({
    get: () => store.activeModal === 'account',
    set: (val) => {
        if (!val) store.closeModal();
    },
});

function updateAccount() {
    errors_.value = [];

    if (!currentPassword.value) {
        errors_.value.push({ field: 'currentPassword', message: 'Please enter your current password.' });
    }

    if (newPassword.value && newPassword.value !== confirmNewPassword.value) {
        errors_.value.push({ field: 'newPassword', message: "Your passwords don't match." });
    }

    if (newPassword.value && (newPassword.value.length < 5 || newPassword.value.length > 60)) {
        errors_.value.push({
            field: 'newPassword',
            message: 'Please enter a password between 5 and 60 characters.',
        });
    }

    if (errors_.value.length) {
        return;
    }

    const data = { username: username.value, currentPassword: currentPassword.value };

    let dirty = false;

    if (newPassword.value) {
        dirty = true;
        data.newPassword = newPassword.value;
    }
    if (newEmail.value) {
        dirty = true;
        data.newEmail = newEmail.value;
    }

    if (!dirty) return;

    currentPassword.value = '';
    saving.value = true;

    fetchJson('/api/account', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify(data),
    })
        .then((_response) => {
            saving.value = false;
            shown.value = false;
        })
        .catch((err) => {
            errors_.value = err;
            saving.value = false;
        });
}

function showDeleteAccount() {
    store.showModal('deleteAccount');
}
</script>

<style lang="scss"></style>
