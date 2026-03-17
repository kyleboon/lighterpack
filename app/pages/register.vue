<template>
    <div id="registerContainer">
        <modal id="register" :shown="true" :blackout="true">
            <div class="lpModalHeader">
                <h2>Register an account</h2>
                <NuxtLink to="/signin" class="lpHref"> Already registered? </NuxtLink>
            </div>

            <p v-if="isLocalSaving" class="lpWarning">
                <strong>Note:</strong> Your existing data on your computer <strong>will</strong> be saved to your new
                account.
            </p>

            <registerForm />
        </modal>

        <blackoutFooter />
        <globalAlerts />
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useLighterpackStore } from '~/store/store.js';

defineOptions({ name: 'Register' });

const store = useLighterpackStore();

const isLocalSaving = computed(() => store.saveType === 'local');
</script>

<style lang="scss"></style>
