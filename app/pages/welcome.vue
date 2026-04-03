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
import { useLighterpackStore } from '~/store/store';

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
    --font-display: 'DM Serif Display', georgia, serif;
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

    background: var(--stone-50);
    color: var(--charcoal-950);
    display: flex;
    flex-direction: column;
    font-family: var(--font-ui);
    min-height: 100vh;
}

/* ── Wordmark ──────────────────────────────────────────────── */
.lp-landing .lp-wordmark {
    color: var(--charcoal-100);
    font-family: var(--font-display);
    font-size: 19px;
    font-weight: 400;
    letter-spacing: -0.01em;
    line-height: 1;
    user-select: none;
}

.lp-landing .lp-wordmark-beta {
    color: var(--charcoal-500);
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: 500;
    letter-spacing: 0.04em;
    margin-left: 4px;
    text-transform: uppercase;
    vertical-align: middle;
}

/* ── HERO ──────────────────────────────────────────────────── */
.lp-hero {
    display: flex;
    flex: 1;
    min-height: 100vh;
}

/* Left dark panel */
.lp-hero-left {
    background: var(--charcoal-900);
    display: flex;
    flex: 0 0 400px;
    flex-direction: column;
    gap: var(--space-8);
    justify-content: center;
    padding: 56px 48px;
}

.lp-hero-brand {
    align-items: baseline;
    display: flex;
    gap: 0;
}

.lp-hero-headline {
    color: var(--charcoal-100);
    font-family: var(--font-display);
    font-size: var(--text-3xl);
    font-weight: 400;
    letter-spacing: -0.02em;
    line-height: 1.1;
    margin: 0;

    em {
        color: var(--amber-400);
        font-style: italic;
    }
}

.lp-hero-body {
    color: var(--charcoal-300);
    font-family: var(--font-ui);
    font-size: var(--text-base);
    font-weight: 400;
    line-height: 1.65;
    margin: 0;
}

/* Signin form override — fits dark panel context */
.lp-hero-signin {
    .lpSuccess {
        color: var(--amber-400);
        font-family: var(--font-ui);
        font-size: var(--text-sm);
        line-height: 1.5;
    }

    .lpError {
        color: #c05848;
        font-family: var(--font-ui);
        font-size: var(--text-sm);
        line-height: 1.5;
    }

    .lpFields {
        input[type='email'] {
            background: var(--charcoal-800);
            border: 0.5px solid rgb(200 198 188 / 18%);
            border-radius: var(--radius-md);
            color: var(--charcoal-100);
            display: block;
            font-family: var(--font-ui);
            font-size: var(--text-base);
            margin: 0 0 var(--space-3);
            outline: none;
            padding: 10px 14px;
            transition: border-color var(--transition-fast);
            width: 100%;

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
        border-radius: var(--radius-lg) !important;
        box-shadow: none !important;
        color: var(--charcoal-900) !important;
        font-family: var(--font-ui) !important;
        font-size: var(--text-base) !important;
        font-weight: 600 !important;
        height: 42px;
        letter-spacing: 0;
        padding: 11px 20px !important;
        text-shadow: none !important;
        transition: background-color var(--transition-fast) !important;
        width: 100%;

        &:hover:not(:disabled) {
            background: var(--amber-600) !important;
            box-shadow: none !important;
            color: #fff !important;
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
    background: var(--stone-50);
    border-left: 0.5px solid var(--stone-200);
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--space-8);
    justify-content: center;
    max-width: 760px;
    min-width: 0;
    padding: var(--space-8) var(--space-8);
}

/* ── Inline features ───────────────────────────────────────── */
.lp-features-inline {
    align-self: center;
    border-bottom: 0.5px solid var(--stone-200);
    display: grid;
    gap: var(--space-6);
    grid-template-columns: repeat(3, 1fr);
    max-width: 620px;
    padding-bottom: var(--space-2);
    width: 100%;
}

.lp-feature-inline {
    align-items: flex-start;
    display: flex;
    gap: var(--space-2);
}

.lp-feature-inline-num {
    color: var(--amber-400);
    flex-shrink: 0;
    font-family: var(--font-mono);
    font-size: var(--text-lg);
    font-variant-numeric: tabular-nums;
    font-weight: 500;
    line-height: 1.2;
}

.lp-feature-inline-title {
    color: var(--charcoal-950);
    font-family: var(--font-ui);
    font-size: var(--text-base);
    font-weight: 600;
    line-height: 1.3;
    margin-bottom: 3px;
}

.lp-feature-inline-body {
    color: var(--charcoal-500);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: 400;
    line-height: 1.6;
}

/* ── App mockup ────────────────────────────────────────────── */
.lp-mockup {
    align-self: center;
    background: var(--stone-50);
    border: 0.5px solid var(--stone-300);
    border-radius: var(--radius-xl);
    display: flex;
    height: 460px;
    max-width: 620px;
    overflow: hidden;
    width: 100%;
}

.lp-mockup-sidebar {
    background: var(--charcoal-900);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    gap: 4px;
    padding: 16px 12px;
    width: 148px;
}

.lp-mockup-wordmark {
    color: var(--charcoal-100);
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 400;
    letter-spacing: -0.01em;
    margin-bottom: 14px;
    user-select: none;
}

.lp-mockup-section-label {
    color: var(--charcoal-500);
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: 500;
    letter-spacing: 0.06em;
    margin-top: 6px;
    padding: 4px 6px 2px;
    text-transform: uppercase;
}

.lp-mockup-divider {
    background: var(--charcoal-700);
    height: 0.5px;
    margin: 6px 0;
}

.lp-mockup-nav {
    border-radius: var(--radius-sm);
    color: var(--charcoal-300);
    cursor: default;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    overflow: hidden;
    padding: 5px 8px;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.active {
        background: rgb(232 162 32 / 12%);
        color: var(--amber-400);
    }

    &.muted {
        color: var(--charcoal-500);
        font-size: var(--text-xs);
        padding-bottom: 3px;
        padding-top: 3px;
    }
}

.lp-mockup-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
    padding: 16px 20px;
}

.lp-mockup-header {
    align-items: center;
    border-bottom: 0.5px solid var(--stone-200);
    display: flex;
    justify-content: space-between;
    padding-bottom: 10px;
}

.lp-mockup-list-title {
    color: var(--charcoal-950);
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: 400;
    letter-spacing: -0.01em;
}

.lp-mockup-share-chip {
    background: var(--amber-400);
    border-radius: var(--radius-md);
    color: var(--charcoal-900);
    cursor: default;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    font-weight: 500;
    padding: 4px 10px;
}

.lp-mockup-chart-block {
    align-items: flex-start;
    display: flex;
    flex-shrink: 0;
    gap: 16px;
}

.lp-mockup-donut {
    flex-shrink: 0;
    height: 100px;
    width: 100px;
}

.lp-mockup-right-col {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 10px;
}

.lp-mockup-legend {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.lp-mockup-legend-row {
    align-items: center;
    color: var(--charcoal-950);
    display: flex;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    gap: 5px;

    &.total {
        border-top: 0.5px solid var(--stone-200);
        font-weight: 600;
        margin-top: 1px;
        padding-top: 3px;
    }
}

.lp-mockup-dot {
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
    height: 8px;
    width: 8px;
}

.lp-mockup-cat {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.lp-mockup-weight {
    color: var(--charcoal-500);
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
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
    background: var(--stone-100);
    border-radius: var(--radius-md);
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    padding: 7px 8px;
}

.lp-mockup-stat-num {
    color: var(--charcoal-950);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-variant-numeric: tabular-nums;
    font-weight: 500;
    line-height: 1;
}

.lp-mockup-stat-label {
    color: var(--stone-500);
    font-family: var(--font-ui);
    font-size: var(--text-xs);
}

.lp-mockup-category {
    color: var(--charcoal-950);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: 600;
    letter-spacing: -0.01em;
    margin-bottom: 2px;
}

.lp-mockup-table {
    border-collapse: collapse;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    width: 100%;

    th {
        border-bottom: 0.5px solid var(--stone-300);
        color: var(--charcoal-500);
        font-weight: 600;
        padding: 0 6px 4px;
        text-align: left;
    }

    th:first-child {
        padding-left: 0;
    }

    td {
        border-bottom: 0.5px solid var(--stone-200);
        color: var(--charcoal-950);
        padding: 5px 6px;
        vertical-align: middle;
    }

    td:first-child {
        padding-left: 0;
    }

    td:nth-child(2),
    td:nth-child(3),
    th:nth-child(2),
    th:nth-child(3) {
        color: var(--charcoal-500);
        font-family: var(--font-mono);
        font-variant-numeric: tabular-nums;
        text-align: right;
        white-space: nowrap;
    }

    tr:last-child td {
        border-bottom: none;
    }
}

/* ── Responsive ───────────────────────────────────────────── */
@media (width <= 900px) {
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
        height: auto;
        max-width: 100%;
        min-height: 360px;
    }

    .lp-features-inline {
        gap: var(--space-5);
        grid-template-columns: 1fr;
        max-width: 100%;
    }
}

@media (width <= 600px) {
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
