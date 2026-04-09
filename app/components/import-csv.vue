<template>
    <div id="importCSV">
        <modal id="importValidate" :shown="shown" label-id="import-csv-dialog-title" @hide="shown = false">
            <h2 id="import-csv-dialog-title">Confirm your import</h2>
            <div id="importData">
                <ul class="lpTable lpDataTable">
                    <li class="lpRow lpHeader">
                        <span class="lpCell">Item Name</span>
                        <span class="lpCell">Category</span>
                        <span class="lpCell">Description</span>
                        <span class="lpCell">Qty</span>
                        <span class="lpCell">Weight</span>
                        <span class="lpCell">Unit</span>
                        <span v-if="hasPrice" class="lpCell">Price</span>
                        <span v-if="hasWorn" class="lpCell">Worn</span>
                        <span v-if="hasConsumable" class="lpCell">Consumable</span>
                    </li>
                    <li v-for="(row, index) in importData.data" :key="index" class="lpRow">
                        <span class="lpCell">{{ row.name }}</span>
                        <span class="lpCell">{{ row.category }}</span>
                        <span class="lpCell">{{ row.description }}</span>
                        <span class="lpCell">{{ row.qty }}</span>
                        <span class="lpCell">{{ row.weight }}</span>
                        <span class="lpCell">{{ row.unit }}</span>
                        <span v-if="hasPrice" class="lpCell">{{ row.price || '' }}</span>
                        <span v-if="hasWorn" class="lpCell">{{ row.worn ? '&#10003;' : '' }}</span>
                        <span v-if="hasConsumable" class="lpCell">{{ row.consumable ? '&#10003;' : '' }}</span>
                    </li>
                </ul>
            </div>
            <a id="importConfirm" class="lpButton" @click="importList">Import List</a>
            <a class="lpButton close" @click="shown = false">Cancel Import</a>
        </modal>
        <form id="csvUpload">
            <input id="csv" ref="csvInput" type="file" name="csv" />
        </form>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useLighterpackStore } from '../store/store';
import { parseCSV } from '../utils/csvParser.js';
import modal from './modal.vue';

defineOptions({ name: 'ImportCsv' });

const store = useLighterpackStore();

const csvInput = ref(null);
const shown = ref(false);
const importData = ref({});

const library = computed(() => store.library);
const hasPrice = computed(() => importData.value.data?.some((row) => row.price > 0));
const hasWorn = computed(() => importData.value.data?.some((row) => row.worn));
const hasConsumable = computed(() => importData.value.data?.some((row) => row.consumable));

watch(
    () => store.importCSVTrigger,
    () => {
        csvInput.value.click();
    },
);

onMounted(() => {
    csvInput.value.onchange = importCSV;
});

function importCSV(evt) {
    const file = evt.target.files[0];
    const name = file.name;

    if (file.name.length < 1) {
        return;
    }
    if (file.size > 1000000) {
        alert('File is too big');
        return;
    }
    if (name.substring(name.length - 4).toLowerCase() !== '.csv') {
        alert('Please select a CSV.');
        return;
    }
    const reader = new FileReader();

    reader.onload = (theFile) => {
        validateImport(theFile.target.result, file.name.substring(0, file.name.length - 4).replace(/_/g, ' '));
    };

    reader.readAsText(file);
}

function validateImport(input, name) {
    const data = parseCSV(input);
    importData.value = { data, name };

    if (!data.length) {
        alert('Unable to load spreadsheet - please verify the format.');
    } else {
        shown.value = true;
    }
}

function importList() {
    store.importCSV(importData.value);
    shown.value = false;
}
</script>

<style>
#importValidate {
    max-height: 80vh;
    overflow-y: auto;
    width: 780px;
}

#importData {
    margin-bottom: 16px;
    max-height: 50vh;
    overflow-y: auto;
}
</style>
