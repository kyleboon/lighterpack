<template>
    <div id="lp-moderation">
        <h1>Admin panel</h1>

        <form @submit.prevent="searchUsers">
            <input v-model="searchQuery" type="text" placeholder="Search for a user..." />
            <button>Search</button>
        </form>
        <ul v-if="resultsLoaded" class="lp-moderation-search-results">
            <li v-for="result in searchResults" :key="result.username" @click="setUser(result)">
                {{ result.username }}
            </li>
        </ul>

        <div v-if="userToInspect" class="lp-moderation-user-to-inspect">
            <h2>{{ userToInspect.username }}</h2>
            <section>
                <button @click="clearSession(userToInspect)">Clear session</button>
                <button @click="resetPassword(userToInspect)">Reset password</button>
                <template v-if="newPassword"> <strong>New Password:</strong> {{ newPassword }} </template>
            </section>
            <section>
                <textarea id="lp-moderation-user-library-json" v-model="editableLibrary" />
            </section>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { fetchJson } from '../utils/utils.js';

defineOptions({ name: 'Admin' });
definePageMeta({ middleware: 'auth' });

const searchQuery = ref('');
const searchResults = ref(null);
const userToInspect = ref(null);
const editableLibrary = ref(null);
const newPassword = ref(null);

const resultsLoaded = computed(() => !!searchResults.value);

function searchUsers() {
    fetchJson(`/moderation/search?q=${searchQuery.value}`, {
        method: 'GET',
        credentials: 'same-origin',
    })
        .then((response) => {
            searchResults.value = response.results;
        })
        .catch((err) => {
            console.log(err);
        });
}

function setUser(user) {
    userToInspect.value = user;
    editableLibrary.value = JSON.stringify(userToInspect.value.library);
    newPassword.value = null;
}

function clearSession(user) {
    fetchJson(`/moderation/clear-session`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: user.username }),
    })
        .then((_response) => {
            console.log('clear session success');
        })
        .catch((err) => {
            console.log(err);
        });
}

function resetPassword(user) {
    fetchJson(`/moderation/reset-password`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: user.username }),
    })
        .then((response) => {
            newPassword.value = response.newPassword;
        })
        .catch((err) => {
            console.log(err);
        });
}
</script>

<style lang="scss">
@use '../assets/css/globals' as *;

#lp-moderation {
    display: grid;
    grid-template-columns: 15em auto;
    padding: 0 2em;

    h1,
    & > form {
        grid-column: 1 / 3;
    }

    .lp-moderation-search-results {
        grid-column: 1;
    }

    .lp-moderation-user-to-inspect {
        grid-column: 2;
    }
}

#lp-moderation-user-library-json {
    height: 20em;
    width: 100%;
}
</style>
