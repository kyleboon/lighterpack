<template>
    <div id="importCSV">
        <modal id="importValidate" :shown="shown" label-id="import-csv-dialog-title" @hide="shown = false">
            <h2 id="import-csv-dialog-title">Confirm your import</h2>
            <div id="importData">
                <ul class="bwTable bwDataTable">
                    <li class="bwRow bwHeader">
                        <span class="bwCell">Item Name</span>
                        <span class="bwCell">Category</span>
                        <span class="bwCell">Description</span>
                        <span class="bwCell">Qty</span>
                        <span class="bwCell">Weight</span>
                        <span class="bwCell">Unit</span>
                        <span v-if="hasPrice" class="bwCell">Price</span>
                        <span v-if="hasWorn" class="bwCell">Worn</span>
                        <span v-if="hasConsumable" class="bwCell">Consumable</span>
                    </li>
                    <li v-for="(row, index) in importData.data" :key="index" class="bwRow">
                        <span class="bwCell">{{ row.name }}</span>
                        <span class="bwCell">{{ row.category }}</span>
                        <span class="bwCell">{{ row.description }}</span>
                        <span class="bwCell">{{ row.qty }}</span>
                        <span class="bwCell">{{ row.weight }}</span>
                        <span class="bwCell">{{ row.unit }}</span>
                        <span v-if="hasPrice" class="bwCell">{{ row.price || '' }}</span>
                        <span v-if="hasWorn" class="bwCell">{{ row.worn ? '&#10003;' : '' }}</span>
                        <span v-if="hasConsumable" class="bwCell">{{ row.consumable ? '&#10003;' : '' }}</span>
                    </li>
                </ul>
            </div>
            <a id="importConfirm" class="bwButton" @click="importList">Import List</a>
            <a class="bwButton close" @click="shown = false">Cancel Import</a>
        </modal>
        <form id="csvUpload">
            <input id="csv" ref="csvInput" type="file" name="csv" />
        </form>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useBaseweightStore } from '../store/store';
import { parseCSV } from '../utils/csvParser.js';
import modal from './modal.vue';

defineOptions({ name: 'ImportCsv' });

const store = useBaseweightStore();

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
