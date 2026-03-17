<template>
    <div id="registerContainer">
        <modal id="register" :shown="true" :blackout="true">
            <div class="lpModalHeader">
                <h2>Register an account</h2>
                <router-link to="/signin" class="lpHref"> Already registered? </router-link>
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
import { useLighterpackStore } from '../../app/store/store.js';
import blackoutFooter from '../../app/components/blackout-footer.vue';
import globalAlerts from '../../app/components/global-alerts.vue';
import modal from '../../app/components/modal.vue';
import registerForm from '../../app/components/register-form.vue';

defineOptions({ name: 'Register' });

const store = useLighterpackStore();

const isLocalSaving = computed(() => store.saveType === 'local');
</script>

<style lang="scss"></style>
