<template>
    <span v-if="isSignedIn" id="settings" class="headerItem hasPopover">
        <PopoverHover>
            <template #target><i class="lpSprite lpSettings" /> Settings</template>
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
import { useLighterpackStore } from '../store/store.js';
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
#csvUrl {
    display: block;
    margin-top: 15px;
}

#lpOptionalFields {
    margin: 0;
    padding: 0;
}

.lpOptionalField {
    list-style-type: none;
    margin: 0;
    padding: 0;
}

#lpPriceSettings {
    input {
        display: inline-block;
        margin-left: 10px;
        width: 50px;
    }
}

#share .lpContent {
    width: 330px;
}

#settings .lpContent {
    width: 200px;
}
</style>
