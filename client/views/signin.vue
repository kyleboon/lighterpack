<template>
    <div id="signinContainer">
        <modal id="signin" :shown="true" :blackout="true">
            <div class="lpModalHeader">
                <h2>Sign in</h2>
                <router-link to="/register" class="lpHref"> Need to register? </router-link>
            </div>
            <SigninForm :message="message" />
        </modal>

        <blackoutFooter />
        <globalAlerts />
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import blackoutFooter from '../components/blackout-footer.vue';
import globalAlerts from '../components/global-alerts.vue';
import modal from '../components/modal.vue';
import SigninForm from '../components/signin-form.vue';

defineOptions({ name: 'Signin' });

const route = useRoute();

const message = computed(() => {
    if (route.path.indexOf('/reset-password') > -1 || route.path.indexOf('/forgot-username') > -1) {
        return 'An email has been sent to the address associated with your account. Note: emails to yahoo.com addresses are currently being blocked. Please reach out to info@lighterpack.com for assistance if you do not receive your email.';
    }
    return '';
});
</script>

<style lang="scss"></style>
