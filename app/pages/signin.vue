<template>
    <div id="signinContainer">
        <modal id="signin" :shown="true" :blackout="true">
            <div class="lpModalHeader">
                <h2>Sign in</h2>
            </div>
            <SigninForm />
        </modal>

        <blackoutFooter />
        <globalAlerts />
    </div>
</template>

<script setup>
defineOptions({ name: 'Signin' });
</script>

<style lang="scss"></style>
