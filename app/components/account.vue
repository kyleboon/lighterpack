<template>
    <modal id="accountSettings" :shown="shown" label-id="account-dialog-title" @hide="shown = false">
        <h2 id="account-dialog-title">Account Settings</h2>

        <p>
            Signed in as <strong>{{ currentEmail }}</strong>
        </p>

        <hr class="lp-account-divider" />

        <h3 class="lp-account-section-title">Display Settings</h3>

        <ul id="lpOptionalFields">
            <li v-for="optionalField in optionalFieldsLookup" :key="optionalField.name" class="lpOptionalField">
                <label>
                    <input
                        :checked="optionalField.value"
                        type="checkbox"
                        @change="toggleOptionalField(optionalField.name)"
                    />
                    {{ optionalField.displayName }}
                </label>
            </li>
        </ul>

        <div v-if="library.optionalFields['price']" id="lpPriceSettings">
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

        <hr class="lp-account-divider" />

        <div class="lpButtons">
            <a class="lpHref" @click="shown = false">Close</a>
            <a class="lpHref" @click="showDeleteAccount">Delete account</a>
        </div>
    </modal>
</template>

<script setup>
import { computed } from 'vue';
import { useLighterpackStore } from '../store/store';
import modal from './modal.vue';

defineOptions({ name: 'Account' });

const store = useLighterpackStore();

const currentEmail = computed(() => store.loggedIn);
const library = computed(() => store.library);
const shown = computed({
    get: () => store.activeModal === 'account',
    set: (val) => {
        if (!val) store.closeModal();
    },
});

const optionalFieldsLookup = computed(() => {
    const fields = [
        { name: 'images', displayName: 'Item images' },
        { name: 'price', displayName: 'Item prices' },
        { name: 'worn', displayName: 'Worn items' },
        { name: 'consumable', displayName: 'Consumable items' },
        { name: 'listDescription', displayName: 'List descriptions' },
    ];
    return fields.map((f) => ({ ...f, value: library.value.optionalFields[f.name] }));
});

function toggleOptionalField(optionalField) {
    store.toggleOptionalField(optionalField);
}

function updateCurrencySymbol(evt) {
    store.updateCurrencySymbol(evt.target.value);
}

function showDeleteAccount() {
    store.showModal('deleteAccount');
}

defineExpose({ shown, currentEmail, showDeleteAccount });
</script>

<style>
#accountSettings {
    width: 380px;
}

.lp-account-divider {
    border: none;
    border-top: 1px solid #e8e7e1;
    margin: 16px 0;
}

.lp-account-section-title {
    color: #1e1e1c;
    font-family: Figtree, system-ui, sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    margin: 0 0 10px;
    text-transform: uppercase;
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
