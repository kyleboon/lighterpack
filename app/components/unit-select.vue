<template>
    <div class="lpUnitSelect" :class="{ lpOpen: isOpen, lpHover: isFocused }" @click="toggle($event)">
        <select class="lpUnit lpInvisible" :value="unit" @keyup="keyup($event)" @focus="focusSelect" @blur="blurSelect">
            <option v-for="unitOption in units" :key="unitOption" :value="unitOption">
                {{ unitOption }}
            </option>
        </select>
        <span class="lpDisplay">{{ unit }}</span>
        <i class="lpSprite lpExpand" />
        <ul :class="'lpUnitDropdown ' + unit">
            <li v-for="unitOption in units" :key="unitOption" :class="unitOption" @click="select(unitOption)">
                {{ unitOption }}
            </li>
        </ul>
    </div>
</template>

<script setup>
import { ref } from 'vue';

defineOptions({ name: 'UnitSelect' });

const props = defineProps({
    weight: {
        type: Number,
        default: 0,
    },
    unit: {
        type: String,
        default: null,
    },
    onChange: {
        type: Function,
        default: null,
    },
});

const units = ['oz', 'lb', 'g', 'kg'];
const isOpen = ref(false);
const isFocused = ref(false);

function closeOnEscape(evt) {
    if (evt.keyCode === 27) {
        close();
    }
}

function closeOnClick() {
    close();
}

function bindCloseListeners() {
    window.addEventListener('keyup', closeOnEscape);
    window.addEventListener('click', closeOnClick);
}

function unbindCloseListeners() {
    window.removeEventListener('keyup', closeOnEscape);
    window.removeEventListener('click', closeOnClick);
}

function open() {
    isOpen.value = true;
    bindCloseListeners();
}

function close() {
    isOpen.value = false;
    unbindCloseListeners();
}

function toggle(evt) {
    evt.stopPropagation();
    if (!isOpen.value) {
        open();
    } else {
        close();
    }
}

function select(unit) {
    if (typeof props.onChange === 'function') {
        props.onChange(unit);
    }
}

function keyup(evt) {
    if (typeof props.onChange === 'function') {
        props.onChange(evt.target.value);
    }
}

function focusSelect() {
    isFocused.value = true;
}

function blurSelect() {
    isFocused.value = false;
}

defineExpose({ isOpen, isFocused, select, close, open });
</script>

<style lang="scss">
@use '../css/globals' as *;

.lpUnitSelect {
    border: 1px solid transparent;
    cursor: pointer;
    display: inline-block;
    padding: 0 5px;
    position: relative;

    &:hover,
    &.lpHover {
        background: #fff;
        border: 1px solid $border1;

        i {
            opacity: 1;
        }
    }

    i {
        opacity: 0.6;
    }

    &.lpOpen {
        background: #fff;

        .lpUnitDropdown {
            display: block;
        }
    }

    .lpDisplay {
        display: inline-block;
        width: 1.1em;
    }

    .lpUnitDropdown {
        background: #fff;
        border: 1px solid #ccc;
        display: none;
        left: 0;
        padding: 0;
        position: absolute;
        top: -1px;
        z-index: $aboveSidebar + 1;

        &.lb {
            top: -30px;
        }

        &.g {
            top: -55px;
        }

        &.kg {
            top: -81px;
        }

        li {
            list-style: none;
            padding: 2px 14px;

            &:hover {
                background: $blue1;
                color: #fff;
            }
        }
    }
}
</style>
