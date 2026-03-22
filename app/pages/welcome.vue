<template>
    <div class="lp-landing">
        <!-- ── HERO ────────────────────────────────────────────── -->
        <section class="lp-hero">
            <!-- Left: dark CTA panel -->
            <div class="lp-hero-left">
                <div class="lp-hero-brand">
                    <span class="lp-wordmark">LighterPack</span>
                    <span class="lp-wordmark-beta">beta</span>
                </div>

                <h1 class="lp-hero-headline">
                    Every ounce<br />
                    <em>accounted for.</em>
                </h1>

                <p class="lp-hero-body">LighterPack helps you track the gear you bring on adventures.</p>

                <div class="lp-hero-signin">
                    <SigninForm />
                </div>
            </div>

            <!-- Right: features + app mockup -->
            <div class="lp-hero-right">
                <div class="lp-features-inline">
                    <div class="lp-feature-inline">
                        <span class="lp-feature-inline-num">1.</span>
                        <div>
                            <div class="lp-feature-inline-title">Enter your packing lists</div>
                            <div class="lp-feature-inline-body">
                                Add items with weights in oz, lb, g, or kg. Categories keep gear organized.
                            </div>
                        </div>
                    </div>
                    <div class="lp-feature-inline">
                        <span class="lp-feature-inline-num">2.</span>
                        <div>
                            <div class="lp-feature-inline-title">Visualize your pack weight</div>
                            <div class="lp-feature-inline-body">
                                The donut chart breaks down your load. Base weight, consumables, worn — all tracked.
                            </div>
                        </div>
                    </div>
                    <div class="lp-feature-inline">
                        <span class="lp-feature-inline-num">3.</span>
                        <div>
                            <div class="lp-feature-inline-title">Share your lists</div>
                            <div class="lp-feature-inline-body">
                                Every list gets a public URL. Post it to trail forums for gear feedback.
                            </div>
                        </div>
                    </div>
                </div>

                <div class="lp-mockup" aria-hidden="true">
                    <!-- Mini sidebar -->
                    <div class="lp-mockup-sidebar">
                        <div class="lp-mockup-wordmark">LighterPack</div>
                        <div class="lp-mockup-section-label">Lists</div>
                        <div class="lp-mockup-nav active">Summer Sierra</div>
                        <div class="lp-mockup-nav">PCT Section J</div>
                        <div class="lp-mockup-nav">Shakedown 2024</div>
                        <div class="lp-mockup-divider"></div>
                        <div class="lp-mockup-section-label">Gear</div>
                        <div class="lp-mockup-nav muted">Big Agnes UL2</div>
                        <div class="lp-mockup-nav muted">Nemo Tensor pad</div>
                        <div class="lp-mockup-nav muted">Lezyne pump</div>
                    </div>

                    <!-- Content area -->
                    <div class="lp-mockup-content">
                        <div class="lp-mockup-header">
                            <span class="lp-mockup-list-title">Summer Sierra</span>
                            <span class="lp-mockup-share-chip">Share</span>
                        </div>

                        <!-- Chart + legend + stats -->
                        <div class="lp-mockup-chart-block">
                            <svg class="lp-mockup-donut" viewBox="0 0 120 120">
                                <!-- Bike 40% -->
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="40"
                                    fill="none"
                                    stroke="#4D84B4"
                                    stroke-width="20"
                                    stroke-dasharray="100.53 251.33"
                                    transform="rotate(-90 60 60)"
                                />
                                <!-- Shelter 25% -->
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="40"
                                    fill="none"
                                    stroke="#C05848"
                                    stroke-width="20"
                                    stroke-dasharray="62.83 251.33"
                                    transform="rotate(54 60 60)"
                                />
                                <!-- Clothing 20% -->
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="40"
                                    fill="none"
                                    stroke="#5A8C6A"
                                    stroke-width="20"
                                    stroke-dasharray="50.27 251.33"
                                    transform="rotate(144 60 60)"
                                />
                                <!-- Sleep 15% -->
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="40"
                                    fill="none"
                                    stroke="#7B6EA8"
                                    stroke-width="20"
                                    stroke-dasharray="37.70 251.33"
                                    transform="rotate(216 60 60)"
                                />
                                <!-- Center fill -->
                                <circle cx="60" cy="60" r="28" fill="#FAFAF7" />
                            </svg>

                            <div class="lp-mockup-right-col">
                                <!-- Legend -->
                                <div class="lp-mockup-legend">
                                    <div class="lp-mockup-legend-row">
                                        <span class="lp-mockup-dot" style="background: #4d84b4"></span>
                                        <span class="lp-mockup-cat">Bike</span>
                                        <span class="lp-mockup-weight">350 oz</span>
                                    </div>
                                    <div class="lp-mockup-legend-row">
                                        <span class="lp-mockup-dot" style="background: #c05848"></span>
                                        <span class="lp-mockup-cat">Shelter</span>
                                        <span class="lp-mockup-weight">32 oz</span>
                                    </div>
                                    <div class="lp-mockup-legend-row">
                                        <span class="lp-mockup-dot" style="background: #5a8c6a"></span>
                                        <span class="lp-mockup-cat">Clothing</span>
                                        <span class="lp-mockup-weight">24 oz</span>
                                    </div>
                                    <div class="lp-mockup-legend-row">
                                        <span class="lp-mockup-dot" style="background: #7b6ea8"></span>
                                        <span class="lp-mockup-cat">Sleep</span>
                                        <span class="lp-mockup-weight">21 oz</span>
                                    </div>
                                    <div class="lp-mockup-legend-row total">
                                        <span class="lp-mockup-cat">Base weight</span>
                                        <span class="lp-mockup-weight">371 oz</span>
                                    </div>
                                </div>

                                <!-- Stat cards -->
                                <div class="lp-mockup-stats">
                                    <div class="lp-mockup-stat">
                                        <span class="lp-mockup-stat-num">371</span>
                                        <span class="lp-mockup-stat-label">base oz</span>
                                    </div>
                                    <div class="lp-mockup-stat">
                                        <span class="lp-mockup-stat-num">382</span>
                                        <span class="lp-mockup-stat-label">total oz</span>
                                    </div>
                                    <div class="lp-mockup-stat">
                                        <span class="lp-mockup-stat-num">$486</span>
                                        <span class="lp-mockup-stat-label">cost</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Gear table -->
                        <div class="lp-mockup-category">Bike</div>
                        <table class="lp-mockup-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Weight</th>
                                    <th>Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Park Tool GP-2 Patch Kit</td>
                                    <td>6 oz</td>
                                    <td>1</td>
                                </tr>
                                <tr>
                                    <td>Pedro's Tire Levers</td>
                                    <td>3 oz</td>
                                    <td>2</td>
                                </tr>
                                <tr>
                                    <td>Lezyne Micro Floor Drive</td>
                                    <td>2 oz</td>
                                    <td>1</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>

        <GlobalAlerts />
    </div>
</template>

<script setup>
import { onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';
import { useLighterpackStore } from '~/store/store.js';

defineOptions({ name: 'Welcome' });

useHead({
    link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
            rel: 'stylesheet',
            href: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600&display=swap',
        },
    ],
});

const store = useLighterpackStore();
const router = useRouter();

onBeforeMount(() => {
    if (store.library) {
        router.push('/');
    }
});
</script>

<style lang="scss">
/* ================================================================
   LighterPack Landing Page
   Tokens follow docs/styleguide/tokens/tokens.css
   ================================================================ */

.lp-landing {
    /* ── Design tokens ──────────────────────────────────────── */
    --charcoal-950: #1e1e1c;
    --charcoal-900: #252523;
    --charcoal-800: #2f2f2c;
    --charcoal-700: #3b3b37;
    --charcoal-500: #5a5954;
    --charcoal-300: #8a8880;
    --charcoal-100: #c8c6bc;

    --amber-50: #fdf0d5;
    --amber-400: #e8a220;
    --amber-600: #c07a0a;

    --stone-50: #fafaf7;
    --stone-100: #f3f2ee;
    --stone-200: #e8e7e2;
    --stone-300: #d0cfc9;
    --stone-500: #a8a79f;

    --font-display: 'DM Serif Display', Georgia, serif;
    --font-ui: 'Figtree', system-ui, sans-serif;
    --font-mono: 'DM Mono', 'Fira Mono', monospace;

    --text-xs: 11px;
    --text-sm: 13px;
    --text-base: 15px;
    --text-lg: 17px;
    --text-xl: 20px;
    --text-2xl: 26px;
    --text-3xl: 34px;

    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 20px;
    --space-6: 24px;
    --space-8: 32px;
    --space-10: 40px;

    --radius-sm: 4px;
    --radius-md: 6px;
    --radius-lg: 10px;
    --radius-xl: 14px;
    --radius-pill: 999px;

    --transition-fast: 120ms ease;

    font-family: var(--font-ui);
    background: var(--stone-50);
    color: var(--charcoal-950);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

/* ── Wordmark ──────────────────────────────────────────────── */
.lp-landing .lp-wordmark {
    font-family: var(--font-display);
    font-size: 19px;
    font-weight: 400;
    color: var(--charcoal-100);
    letter-spacing: -0.01em;
    user-select: none;
    line-height: 1;
}

.lp-landing .lp-wordmark-beta {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--charcoal-500);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    vertical-align: middle;
    margin-left: 4px;
}

/* ── HERO ──────────────────────────────────────────────────── */
.lp-hero {
    display: flex;
    min-height: 100vh;
    flex: 1;
}

/* Left dark panel */
.lp-hero-left {
    flex: 0 0 400px;
    background: var(--charcoal-900);
    padding: 56px 48px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--space-8);
}

.lp-hero-brand {
    display: flex;
    align-items: baseline;
    gap: 0;
}

.lp-hero-headline {
    font-family: var(--font-display);
    font-size: var(--text-3xl);
    font-weight: 400;
    line-height: 1.1;
    letter-spacing: -0.02em;
    color: var(--charcoal-100);
    margin: 0;

    em {
        color: var(--amber-400);
        font-style: italic;
    }
}

.lp-hero-body {
    font-family: var(--font-ui);
    font-size: var(--text-base);
    font-weight: 400;
    line-height: 1.65;
    color: var(--charcoal-300);
    margin: 0;
}

/* Signin form override — fits dark panel context */
.lp-hero-signin {
    .lpSuccess {
        font-family: var(--font-ui);
        font-size: var(--text-sm);
        color: var(--amber-400);
        line-height: 1.5;
    }

    .lpError {
        font-family: var(--font-ui);
        font-size: var(--text-sm);
        color: #c05848;
        line-height: 1.5;
    }

    .lpFields {
        input[type='email'] {
            background: var(--charcoal-800);
            border: 0.5px solid rgba(200, 198, 188, 0.18);
            border-radius: var(--radius-md);
            color: var(--charcoal-100);
            font-family: var(--font-ui);
            font-size: var(--text-base);
            padding: 10px 14px;
            width: 100%;
            display: block;
            margin: 0 0 var(--space-3);
            outline: none;
            transition: border-color var(--transition-fast);

            &::placeholder {
                color: var(--charcoal-500);
            }

            &:focus {
                border-color: var(--amber-400);
            }
        }
    }

    /* Override the gradient button from _common.scss */
    .lp .lpButton,
    .lpButton {
        background: var(--amber-400) !important;
        background-image: none !important;
        box-shadow: none !important;
        color: var(--charcoal-900) !important;
        font-family: var(--font-ui) !important;
        font-size: var(--text-base) !important;
        font-weight: 600 !important;
        height: 42px;
        border-radius: var(--radius-lg) !important;
        padding: 11px 20px !important;
        width: 100%;
        text-shadow: none !important;
        transition: background-color var(--transition-fast) !important;
        letter-spacing: 0;

        &:hover:not(:disabled) {
            background: var(--amber-600) !important;
            color: #fff !important;
            box-shadow: none !important;
        }

        &:focus-visible {
            outline: 2px solid var(--amber-400);
            outline-offset: 2px;
        }

        &:active {
            transform: scale(0.98);
        }
    }

    .lpButtons {
        margin-top: var(--space-1);
    }
}

/* Right light panel */
.lp-hero-right {
    flex: 1;
    min-width: 0;
    max-width: 760px;
    background: var(--stone-50);
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--space-8);
    padding: var(--space-8) var(--space-8);
    border-left: 0.5px solid var(--stone-200);
}

/* ── Inline features ───────────────────────────────────────── */
.lp-features-inline {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-6);
    max-width: 620px;
    width: 100%;
    align-self: center;
    padding-bottom: var(--space-2);
    border-bottom: 0.5px solid var(--stone-200);
}

.lp-feature-inline {
    display: flex;
    gap: var(--space-2);
    align-items: flex-start;
}

.lp-feature-inline-num {
    font-family: var(--font-mono);
    font-size: var(--text-lg);
    font-weight: 500;
    color: var(--amber-400);
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
    flex-shrink: 0;
}

.lp-feature-inline-title {
    font-family: var(--font-ui);
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--charcoal-950);
    line-height: 1.3;
    margin-bottom: 3px;
}

.lp-feature-inline-body {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: 400;
    line-height: 1.6;
    color: var(--charcoal-500);
}

/* ── App mockup ────────────────────────────────────────────── */
.lp-mockup {
    width: 100%;
    max-width: 620px;
    height: 460px;
    align-self: center;
    display: flex;
    border: 0.5px solid var(--stone-300);
    border-radius: var(--radius-xl);
    overflow: hidden;
    background: var(--stone-50);
}

.lp-mockup-sidebar {
    width: 148px;
    flex-shrink: 0;
    background: var(--charcoal-900);
    padding: 16px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.lp-mockup-wordmark {
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 400;
    color: var(--charcoal-100);
    letter-spacing: -0.01em;
    margin-bottom: 14px;
    user-select: none;
}

.lp-mockup-section-label {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--charcoal-500);
    padding: 4px 6px 2px;
    margin-top: 6px;
}

.lp-mockup-divider {
    height: 0.5px;
    background: var(--charcoal-700);
    margin: 6px 0;
}

.lp-mockup-nav {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--charcoal-300);
    padding: 5px 8px;
    border-radius: var(--radius-sm);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: default;

    &.active {
        background: rgba(232, 162, 32, 0.12);
        color: var(--amber-400);
    }

    &.muted {
        font-size: var(--text-xs);
        color: var(--charcoal-500);
        padding-top: 3px;
        padding-bottom: 3px;
    }
}

.lp-mockup-content {
    flex: 1;
    padding: 16px 20px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.lp-mockup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 10px;
    border-bottom: 0.5px solid var(--stone-200);
}

.lp-mockup-list-title {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: 400;
    color: var(--charcoal-950);
    letter-spacing: -0.01em;
}

.lp-mockup-share-chip {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--charcoal-900);
    background: var(--amber-400);
    padding: 4px 10px;
    border-radius: var(--radius-md);
    cursor: default;
}

.lp-mockup-chart-block {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    flex-shrink: 0;
}

.lp-mockup-donut {
    width: 100px;
    height: 100px;
    flex-shrink: 0;
}

.lp-mockup-right-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.lp-mockup-legend {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.lp-mockup-legend-row {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--charcoal-950);

    &.total {
        border-top: 0.5px solid var(--stone-200);
        padding-top: 3px;
        margin-top: 1px;
        font-weight: 600;
    }
}

.lp-mockup-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.lp-mockup-cat {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.lp-mockup-weight {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--charcoal-500);
    white-space: nowrap;
}

.lp-mockup-legend-row.total .lp-mockup-weight {
    color: var(--charcoal-950);
}

.lp-mockup-stats {
    display: flex;
    gap: 6px;
}

.lp-mockup-stat {
    flex: 1;
    background: var(--stone-100);
    border-radius: var(--radius-md);
    padding: 7px 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.lp-mockup-stat-num {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    color: var(--charcoal-950);
    line-height: 1;
}

.lp-mockup-stat-label {
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--stone-500);
}

.lp-mockup-category {
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--charcoal-950);
    letter-spacing: -0.01em;
    margin-bottom: 2px;
}

.lp-mockup-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-ui);
    font-size: var(--text-xs);

    th {
        text-align: left;
        font-weight: 600;
        color: var(--charcoal-500);
        padding: 0 6px 4px;
        border-bottom: 0.5px solid var(--stone-300);
    }

    th:first-child {
        padding-left: 0;
    }

    td {
        padding: 5px 6px;
        color: var(--charcoal-950);
        border-bottom: 0.5px solid var(--stone-200);
        vertical-align: middle;
    }

    td:first-child {
        padding-left: 0;
    }

    td:nth-child(2),
    td:nth-child(3),
    th:nth-child(2),
    th:nth-child(3) {
        text-align: right;
        font-family: var(--font-mono);
        font-variant-numeric: tabular-nums;
        color: var(--charcoal-500);
        white-space: nowrap;
    }

    tr:last-child td {
        border-bottom: none;
    }
}

/* ── Responsive ───────────────────────────────────────────── */
@media (max-width: 900px) {
    .lp-hero {
        flex-direction: column;
        min-height: auto;
    }

    .lp-hero-left {
        flex: none;
        padding: 48px 32px;
    }

    .lp-hero-right {
        border-left: none;
        border-top: 0.5px solid var(--stone-200);
        padding: 32px 24px;
    }

    .lp-mockup {
        max-width: 100%;
        height: auto;
        min-height: 360px;
    }

    .lp-features-inline {
        grid-template-columns: 1fr;
        gap: var(--space-5);
        max-width: 100%;
    }
}

@media (max-width: 600px) {
    .lp-hero-left {
        padding: 40px 24px;
    }

    .lp-hero-headline {
        font-size: var(--text-2xl);
    }

    .lp-mockup-sidebar {
        width: 120px;
    }
}
</style>
