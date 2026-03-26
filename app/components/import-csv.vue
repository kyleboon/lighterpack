<template>
    <div id="importCSV">
        <modal id="importValidate" :shown="shown" @hide="shown = false">
            <h2>Confirm your import</h2>
            <div id="importData">
                <ul class="lpTable lpDataTable">
                    <li class="lpRow lpHeader">
                        <span class="lpCell">Item Name</span>
                        <span class="lpCell">Category</span>
                        <span class="lpCell">Description</span>
                        <span class="lpCell">Qty</span>
                        <span class="lpCell">Weight</span>
                        <span class="lpCell">Unit</span>
                    </li>
                    <li v-for="(row, index) in importData.data" :key="index" class="lpRow">
                        <span class="lpCell">{{ row.name }}</span>
                        <span class="lpCell">{{ row.category }}</span>
                        <span class="lpCell">{{ row.description }}</span>
                        <span class="lpCell">{{ row.qty }}</span>
                        <span class="lpCell">{{ row.weight }}</span>
                        <span class="lpCell">{{ row.unit }}</span>
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
import { useLighterpackStore } from '../store/store.js';
import { parseCSV } from '../utils/csvParser.js';
import modal from './modal.vue';

defineOptions({ name: 'ImportCsv' });

const store = useLighterpackStore();

const csvInput = ref(null);
const shown = ref(false);
const importData = ref({});

const library = computed(() => store.library);

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

<style lang="scss">
#importValidate {
    max-height: 80vh;
    overflow-y: auto;
    width: 650px;
}

#importData {
    margin-bottom: 16px;
    max-height: 50vh;
    overflow-y: auto;
}
</style>
