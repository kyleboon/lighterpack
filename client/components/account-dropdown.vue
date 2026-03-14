<template>
    <span class="headerItem hasPopover">
        <PopoverHover id="headerPopover">
            <template #target>Signed in as <span class="username">{{ username }}</span> <i class="lpSprite lpExpand" /></template>
            <template #content>
                <a class="lpHref accountSettings" @click="showAccount">Account Settings</a><br>
                <a class="lpHref" @click="showHelp">Help</a><br>
                <a class="lpHref signout" @click="signout">Sign Out</a>
            </template>
        </PopoverHover>
    </span>
</template>

<script>
import PopoverHover from './popover-hover.vue';

export default {
    name: 'AccountDropdown',
    components: {
        PopoverHover,
    },
    computed: {
        library() {
            return this.$store.library;
        },
        username() {
            return this.$store.loggedIn;
        },
    },
    methods: {
        showAccount() {
            bus.$emit('showAccount');
        },
        showHelp() {
            bus.$emit('showHelp');
        },
        signout() {
            this.$store.signout();
            this.$router.push('/signin');
        },
    },
};
</script>

<style lang="scss">
#headerPopover .lpContent {
    min-width: 9em;
}
</style>
