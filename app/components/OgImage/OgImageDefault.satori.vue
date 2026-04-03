<template>
    <div
        :style="{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            background: '#252523',
            fontFamily: 'sans-serif',
            padding: '60px',
        }"
    >
        <!-- Wordmark -->
        <div
            :style="{
                display: 'flex',
                alignItems: 'baseline',
                gap: '8px',
                marginBottom: '40px',
            }"
        >
            <span
                :style="{
                    color: '#c8c6bc',
                    fontSize: '28px',
                    fontWeight: 400,
                }"
            >
                LighterPack
            </span>
        </div>

        <!-- Title -->
        <div
            :style="{
                display: 'flex',
                flexDirection: 'column',
                flex: '1',
                justifyContent: 'center',
            }"
        >
            <div
                :style="{
                    color: '#fafaf7',
                    fontSize: '56px',
                    fontWeight: 700,
                    lineHeight: 1.15,
                    marginBottom: '16px',
                }"
            >
                {{ title }}
            </div>
            <div
                v-if="description"
                :style="{
                    color: '#8a8880',
                    fontSize: '28px',
                    lineHeight: 1.4,
                }"
            >
                {{ description }}
            </div>
        </div>

        <!-- Stats bar (only shown when itemCount > 0) -->
        <div
            v-if="itemCount > 0"
            :style="{
                display: 'flex',
                gap: '32px',
                borderTop: '1px solid #3b3b37',
                paddingTop: '24px',
                marginTop: '24px',
            }"
        >
            <div :style="{ display: 'flex', alignItems: 'baseline', gap: '8px' }">
                <span :style="{ color: '#e8a220', fontSize: '32px', fontWeight: 700 }">{{ itemCount }}</span>
                <span :style="{ color: '#8a8880', fontSize: '20px' }">items</span>
            </div>
            <div v-if="categoryCount > 0" :style="{ display: 'flex', alignItems: 'baseline', gap: '8px' }">
                <span :style="{ color: '#e8a220', fontSize: '32px', fontWeight: 700 }">{{ categoryCount }}</span>
                <span :style="{ color: '#8a8880', fontSize: '20px' }">categories</span>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    title: {
        type: String,
        default: 'LighterPack',
    },
    description: {
        type: String,
        default: '',
    },
    itemCount: {
        type: Number,
        default: 0,
    },
    categoryCount: {
        type: Number,
        default: 0,
    },
});
</script>
