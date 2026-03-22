<template>
    <ul v-if="sanitizedErrors && sanitizedErrors.length" class="lp-errors" role="alert" aria-live="polite">
        <li v-for="error in sanitizedErrors" :key="error.message" class="lp-errors-item">
            <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <circle cx="7" cy="7" r="6" />
                <line x1="7" y1="4.5" x2="7" y2="7.5" />
                <circle cx="7" cy="10" r="0.75" fill="currentColor" stroke="none" />
            </svg>
            {{ error.message }}
        </li>
    </ul>
</template>

<script setup>
import { computed } from 'vue';

defineOptions({ name: 'Errors' });

const props = defineProps({
    errors: {
        type: [Array, Object, String],
        default: null,
    },
});

const sanitizedErrors = computed(() => {
    let errors = props.errors;
    if (!errors) {
        return [];
    }

    if (typeof errors === 'string') {
        return [{ message: errors }];
    }

    if (typeof errors === 'object' && !(errors instanceof Array) && errors.message) {
        return [errors];
    }

    if (typeof errors === 'object' && errors.errors && errors.errors instanceof Array) {
        errors = errors.errors;
    }

    if (typeof errors === 'object' && errors instanceof Array) {
        if (errors.length === 0) {
            return errors;
        }

        const massagedErrors = errors
            .map((error) => {
                if (typeof error === 'string') {
                    return { message: error };
                }

                if (typeof error === 'object' && error.message) {
                    return error;
                }
                return false;
            })
            .filter((error) => !!error.message);

        if (massagedErrors.length) {
            return massagedErrors;
        }
    }

    return [{ message: 'An unknown error occurred.' }];
});
</script>

<style lang="scss">
.lp-errors {
    border-left: 2px solid #c05848;
    border-radius: 0 4px 4px 0;
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
}

.lp-errors-item {
    align-items: center;
    color: #c05848;
    display: flex;
    font-family: 'Figtree', system-ui, sans-serif;
    font-size: 12px;
    font-weight: 500;
    gap: 6px;
    padding: 5px 10px;

    svg {
        flex-shrink: 0;
    }
}
</style>
