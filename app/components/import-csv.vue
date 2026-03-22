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
import modal from './modal.vue';

defineOptions({ name: 'ImportCsv' });

const store = useLighterpackStore();

const csvInput = ref(null);
const shown = ref(false);
const importData = ref({});

const fullUnitToUnit = {
    ounce: 'oz',
    ounces: 'oz',
    oz: 'oz',
    pound: 'lb',
    pounds: 'lb',
    lb: 'lb',
    lbs: 'lb',
    gram: 'g',
    grams: 'g',
    g: 'g',
    kilogram: 'kg',
    kilograms: 'kg',
    kg: 'kg',
    kgs: 'kg',
};

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

function CSVToArray(strData) {
    const strDelimiter = ',';
    const arrData = [[]];
    let arrMatches = null;

    const objPattern = new RegExp(
        `(\\${strDelimiter}|\\r?\\n|\\r|^)` + '(?:"([^"]*(?:""[^"]*)*)"|' + `([^"\\${strDelimiter}\\r\\n]*))`,
        'gi',
    );

    while ((arrMatches = objPattern.exec(strData))) {
        const strMatchedDelimiter = arrMatches[1];
        if (strMatchedDelimiter.length && strMatchedDelimiter !== strDelimiter) {
            arrData.push([]);
        }

        let strMatchedValue;
        if (arrMatches[2]) {
            strMatchedValue = arrMatches[2].replace(new RegExp('""', 'g'), '"');
        } else {
            strMatchedValue = arrMatches[3];
        }

        arrData[arrData.length - 1].push(strMatchedValue);
    }

    return arrData;
}

function validateImport(input, name) {
    const csv = CSVToArray(input);
    importData.value = { data: [], name };

    for (const i in csv) {
        const row = csv[i];
        if (row.length < 6) continue;
        if (row[0].toLowerCase() === 'item name') continue;
        if (isNaN(parseInt(row[3]))) continue;
        if (isNaN(parseInt(row[4]))) continue;
        if (typeof fullUnitToUnit[row[5]] === 'undefined') continue;

        importData.value.data.push({
            name: row[0],
            category: row[1],
            description: row[2],
            qty: parseFloat(row[3]),
            weight: parseFloat(row[4]),
            unit: fullUnitToUnit[row[5]],
        });
    }

    if (!importData.value.data.length) {
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
