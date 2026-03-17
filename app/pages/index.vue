<template>
    <div v-if="isLoaded" id="main" :class="{ lpHasSidebar: library.showSidebar }">
        <sidebar />
        <div class="lpList lpTransition">
            <div id="header" class="clearfix">
                <span class="headerItem">
                    <a id="hamburger" class="lpTransition" @click="toggleSidebar"><i class="lpSprite lpHamburger" /></a>
                </span>
                <input
                    id="lpListName"
                    :value="activeList.name"
                    type="text"
                    class="lpListName lpSilent headerItem"
                    placeholder="List Name"
                    autocomplete="off"
                    name="lastpass-disable-search"
                    @input="updateListName"
                />
                <share />
                <listSettings />
                <accountDropdown v-if="isSignedIn" />
                <span v-else class="headerItem signInRegisterButtons">
                    <NuxtLink to="/register" class="lpButton lpSmall">Register</NuxtLink>
                    or
                    <NuxtLink to="/signin" class="lpButton lpSmall">Sign In</NuxtLink>
                </span>
                <span class="clearfix" />
            </div>

            <list />

            <div id="lpFooter">
                <div class="lpSiteBy">
                    Site by
                    <a class="lpHref" href="https://www.galenmaly.com/" target="_blank" rel="noopener noreferrer"
                        >Galen Maly</a
                    >
                    and
                    <a
                        class="lpHref"
                        href="https://github.com/galenmaly/lighterpack/graphs/contributors"
                        target="_blank"
                        rel="noopener noreferrer"
                        >friends</a
                    >.
                </div>
                <div class="lpContact">
                    <a
                        class="lpHref"
                        href="https://github.com/galenmaly/lighterpack"
                        target="_blank"
                        rel="noopener noreferrer"
                        >Copyleft</a
                    >
                    LighterPack 2019 -
                    <a class="lpHref" href="mailto:info@lighterpack.com">Contact</a>
                </div>
            </div>
        </div>

        <globalAlerts />
        <speedbump />
        <copyList />
        <importCSV />
        <itemImage />
        <itemViewImage />
        <itemLink />
        <help />
        <account />
        <accountDelete />
    </div>
</template>

<script setup>
import { ref, computed, onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';
import { useLighterpackStore } from '~/store/store.js';

defineOptions({ name: 'Dashboard' });

const store = useLighterpackStore();
const router = useRouter();

const isLoaded = ref(false);

const library = computed(() => store.library);
const activeList = computed(() => library.value.getListById(library.value.defaultListId));
const isSignedIn = computed(() => store.loggedIn);

onBeforeMount(() => {
    if (!store.library) {
        router.push('/welcome');
    } else {
        isLoaded.value = true;
    }
});

function toggleSidebar() {
    store.toggleSidebar();
}

function updateListName(evt) {
    store.updateListName({ id: activeList.value.id, name: evt.target.value });
}
</script>

<style lang="scss">
@use '../assets/css/globals' as *;

#header {
    align-items: baseline;
    display: flex;
    height: 60px;
    margin: 0 -20px 20px; /* lpList padding */
    position: relative;
}

#hamburger {
    cursor: pointer;
    display: inline-block;
    opacity: 0.6;
    transition: transform $transitionDurationSlow;

    &:hover {
        opacity: 1;
    }

    .lpHasSidebar & {
        transform: rotate(90deg);
    }
}

#lpListName {
    font-size: 24px;
    font-weight: 600;
    padding: 12px 15px;
}

.headerItem {
    flex: 0 0 auto;
    height: 100%;
    padding: 17px 16px;
    position: relative;

    &:first-child {
        padding-left: 20px;
    }

    .lpPopover {
        &:hover .lpTarget {
            color: $blue1;
        }
    }

    .lpTarget {
        font-weight: 600;
        padding: 17px 16px 15px;
    }

    &#lpListName {
        flex: 1 0 auto;
    }

    &.hasPopover {
        padding: 0;
    }

    &.signInRegisterButtons {
        height: auto;
        padding: 0 16px;
    }
}
</style>
