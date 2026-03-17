<template>
    <modal id="speedbump" :shown="shown" @hide="shown = false">
        <h2 v-if="messages.title">
            {{ messages.title }}
        </h2>

        <p>{{ messages.body }}</p>

        <div class="buttons">
            <button v-focus-on-create class="lpButton" @click="confirmSpeedbump()">
                {{ messages.confirm }}
            </button>
            &nbsp;<button class="lpButton" @click="shown = false">
                {{ messages.cancel }}
            </button>
        </div>
    </modal>
</template>

<script setup>
import { computed } from 'vue';
import { useLighterpackStore } from '../store/store.js';
import modal from './modal.vue';

defineOptions({ name: 'Speedbump' });

const store = useLighterpackStore();

const defaultMessages = { title: '', body: '', confirm: 'Yes', cancel: 'No' };

const shown = computed({
    get: () => store.speedbump !== null,
    set: (val) => {
        if (!val) store.closeSpeedbump();
    },
});

const messages = computed(() => {
    const msgs = Object.assign({}, defaultMessages);
    const speedbump = store.speedbump;
    if (!speedbump) return msgs;
    const options = speedbump.options;
    if (typeof options === 'string') {
        msgs.body = options;
    } else if (options) {
        Object.assign(msgs, options);
    }
    return msgs;
});

function confirmSpeedbump() {
    store.confirmSpeedbump();
}
</script>

<style lang="scss"></style>
