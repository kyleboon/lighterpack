<template>
    <modal id="accountSettings" :shown="shown" @hide="shown = false">
        <h2>Account Settings</h2>

        <p>
            Signed in as <strong>{{ currentEmail }}</strong>
        </p>

        <div class="lpButtons">
            <a class="lpHref" @click="shown = false">Close</a>
            <a class="lpHref" @click="showDeleteAccount">Delete account</a>
        </div>
    </modal>
</template>

<script setup>
import { computed } from 'vue';
import { useLighterpackStore } from '../store/store.js';
import modal from './modal.vue';

defineOptions({ name: 'Account' });

const store = useLighterpackStore();

const currentEmail = computed(() => store.loggedIn);
const shown = computed({
    get: () => store.activeModal === 'account',
    set: (val) => {
        if (!val) store.closeModal();
    },
});

function showDeleteAccount() {
    store.showModal('deleteAccount');
}

defineExpose({ shown, currentEmail, showDeleteAccount });
</script>

<style lang="scss"></style>
