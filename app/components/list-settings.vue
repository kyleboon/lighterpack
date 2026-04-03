<template>
    <span v-if="isSignedIn" id="settings" class="headerItem hasPopover">
        <PopoverHover>
            <template #target>
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    aria-hidden="true"
                >
                    <circle cx="8" cy="8" r="2.5" />
                    <path
                        d="M8 1.5v1M8 13.5v1M1.5 8h1m10 0h1M3.4 3.4l.7.7M11.9 11.9l.7.7M3.4 12.6l.7-.7M11.9 4.1l.7-.7"
                    />
                </svg>
                Settings
            </template>
            <template #content>
                <ul id="lpOptionalFields">
                    <li v-for="optionalField in optionalFieldsLookup" :key="optionalField.name" class="lpOptionalField">
                        <label>
                            <input
                                :checked="optionalField.value"
                                type="checkbox"
                                @change="toggleOptionalField($event, optionalField.name)"
                            />
                            {{ optionalField.displayName }}
                        </label>
                    </li>
                </ul>
                <div v-if="library.optionalFields['price']" id="lpPriceSettings">
                    <hr />
                    <label>
                        Currency:
                        <input
                            id="currencySymbol"
                            type="text"
                            maxlength="4"
                            :value="library.currencySymbol"
                            @input="updateCurrencySymbol($event)"
                        />
                    </label>
                </div>
            </template>
        </PopoverHover>
    </span>
</template>

<script setup>
import { computed } from 'vue';
import { useLighterpackStore } from '../store/store';
import PopoverHover from './popover-hover.vue';

defineOptions({ name: 'ListSettings' });

const store = useLighterpackStore();

const library = computed(() => store.library);
const isSignedIn = computed(() => store.loggedIn);

const optionalFieldsLookup = computed(() => {
    const fields = [
        { name: 'images', displayName: 'Item images', cssClass: 'lpShowImages' },
        { name: 'price', displayName: 'Item prices', cssClass: 'lpShowPrices' },
        { name: 'worn', displayName: 'Worn items', cssClass: 'lpShowWorn' },
        { name: 'consumable', displayName: 'Consumable items', cssClass: 'lpShowConsumable' },
        { name: 'listDescription', displayName: 'List descriptions', cssClass: 'lpShowListDescription' },
    ];
    return fields.map((f) => ({ ...f, value: library.value.optionalFields[f.name] }));
});

function toggleOptionalField(_evt, optionalField) {
    store.toggleOptionalField(optionalField);
}

function updateCurrencySymbol(evt) {
    store.updateCurrencySymbol(evt.target.value);
}
</script>

<style lang="scss">
#settings .lp-popover-content,
#settings .lpContent {
    width: 200px;
}

#lpOptionalFields {
    display: flex;
    flex-direction: column;
    gap: 2px;
    list-style: none;
    margin: 0;
    padding: 0;
}

.lpOptionalField {
    label {
        align-items: center;
        cursor: pointer;
        display: flex;
        font-family: Figtree, system-ui, sans-serif;
        font-size: 13px;
        gap: 8px;
        padding: 4px 0;
        user-select: none;

        &:hover {
            color: #1e1e1c;
        }
    }

    input[type='checkbox'] {
        accent-color: #e8a220;
        cursor: pointer;
        height: 14px;
        width: 14px;
    }
}

#lpPriceSettings {
    border-top: 1px solid #e8e7e1;
    margin-top: 8px;
    padding-top: 8px;

    label {
        align-items: center;
        display: flex;
        font-family: Figtree, system-ui, sans-serif;
        font-size: 13px;
        gap: 6px;
    }

    input {
        background: #f3f2ee;
        border: 1px solid #d0cfc9;
        border-radius: 4px;
        font-family: 'DM Mono', monospace;
        font-size: 12px;
        padding: 3px 6px;
        width: 50px;

        &:focus {
            border-color: #e8a220;
            outline: none;
        }
    }
}
</style>
