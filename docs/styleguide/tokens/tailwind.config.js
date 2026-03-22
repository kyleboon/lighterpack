/** @type {import('tailwindcss').Config} */

/**
 * LighterPack Design System — Tailwind v3 theme extension
 *
 * Usage: spread the `theme.extend` object into your tailwind.config.js
 *
 *   const { lpTheme } = require('./styleguide/tokens/tailwind.config');
 *   module.exports = {
 *     content: ['./src/**\/*.{html,js,jsx,ts,tsx}'],
 *     theme: { extend: lpTheme },
 *   };
 */

const lpTheme = {
    fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        ui: ['Figtree', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', '"Fira Mono"', 'monospace'],
    },

    colors: {
        charcoal: {
            950: '#1e1e1c',
            900: '#252523',
            800: '#2f2f2c',
            700: '#3b3b37',
            500: '#5a5954',
            300: '#8a8880',
            100: '#c8c6bc',
        },
        amber: {
            50: '#FDF0D5',
            200: '#F5C842',
            400: '#E8A220',
            600: '#C07A0A',
            800: '#8A520A',
        },
        stone: {
            50: '#FAFAF7',
            100: '#F3F2EE',
            200: '#E8E7E2',
            300: '#D0CFC9',
            500: '#A8A79F',
        },
        slate: {
            50: '#E8F0F8',
            200: '#97B8D8',
            400: '#4D84B4',
            600: '#2E5F88',
            800: '#1A3D5C',
        },
        data: {
            bike: '#4D84B4',
            shelter: '#C05848',
            food: '#E8A220',
            clothing: '#5A8C6A',
            sleep: '#7B6EA8',
            other: '#8C7B5C',
        },
    },

    fontSize: {
        'lp-xs': ['11px', { lineHeight: '1.4' }],
        'lp-sm': ['13px', { lineHeight: '1.55' }],
        'lp-base': ['15px', { lineHeight: '1.65' }],
        'lp-lg': ['17px', { lineHeight: '1.4' }],
        'lp-xl': ['20px', { lineHeight: '1.25' }],
        'lp-2xl': ['26px', { lineHeight: '1.2' }],
        'lp-3xl': ['34px', { lineHeight: '1.1' }],
    },

    borderRadius: {
        'lp-sm': '4px',
        'lp-md': '6px',
        'lp-lg': '10px',
        'lp-xl': '14px',
        'lp-pill': '999px',
    },

    transitionDuration: {
        'lp-fast': '120ms',
        'lp-base': '200ms',
    },
};

/**
 * Pre-composed Tailwind class strings.
 * Paste these into className props directly — no need to rebuild class names manually.
 *
 * Usage:
 *   import { tw } from './styleguide/tokens/tailwind.config';
 *   <button className={`${tw.btnBase} ${tw.btnPrimary}`}>Share list</button>
 */
const tw = {
    // ── Typography ────────────────────────────────────────────────
    displayXl: 'font-display text-lp-3xl font-normal tracking-tight',
    displayLg: 'font-display text-lp-2xl font-normal tracking-tight',
    title: 'font-display text-lp-xl font-normal',
    heading: 'font-ui text-lp-lg font-semibold tracking-tight',
    subheading: 'font-ui text-lp-base font-semibold',
    body: 'font-ui text-lp-base font-normal leading-relaxed',
    bodySm: 'font-ui text-lp-sm font-normal',
    label: 'font-ui text-lp-sm font-medium text-charcoal-500',
    labelXs: 'font-ui text-lp-xs font-medium uppercase tracking-wider text-charcoal-300',
    muted: 'text-charcoal-500',
    hint: 'font-ui text-lp-sm text-charcoal-300',
    data: 'font-mono text-lp-base tabular-nums',
    dataLg: 'font-mono text-lp-xl font-medium tabular-nums',
    dataSm: 'font-mono text-lp-sm tabular-nums text-charcoal-500',
    wordmark: 'font-display text-[19px] font-normal text-charcoal-100 tracking-tight select-none',
    sidebarText: 'font-ui text-lp-sm text-charcoal-100',
    sidebarMuted: 'font-ui text-lp-sm text-charcoal-300',

    // ── Buttons ───────────────────────────────────────────────────
    // Always combine btnBase + one variant:
    btnBase:
        'inline-flex items-center justify-center gap-2 font-ui text-lp-sm font-medium leading-none whitespace-nowrap cursor-pointer rounded-lp-md px-[14px] h-[34px] transition-all duration-lp-fast outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 active:scale-[0.98] disabled:opacity-45 disabled:pointer-events-none',
    btnPrimary: 'bg-amber-400 text-charcoal-900 font-semibold hover:bg-amber-600 hover:text-white',
    btnSecondary:
        'bg-transparent text-charcoal-950 border border-[0.5px] border-charcoal-500/30 hover:bg-stone-100 hover:border-stone-300',
    btnGhost: 'bg-transparent text-amber-400 px-1 h-auto rounded-lp-sm hover:text-amber-600 hover:bg-amber-50',
    btnDanger:
        'bg-transparent text-[#C05848] border border-[0.5px] border-[#C05848]/30 hover:bg-[#C05848]/10 hover:border-[#C05848]/50',
    btnSidebar:
        'bg-transparent text-charcoal-100 border border-[0.5px] border-charcoal-100/15 hover:bg-charcoal-800 hover:border-charcoal-100/25',
    btnIcon:
        'w-[30px] h-[30px] p-0 bg-transparent text-charcoal-300 border-none hover:bg-stone-200 hover:text-charcoal-950 rounded-lp-md',
    btnSm: 'text-lp-xs px-[10px] h-[26px] rounded-lp-sm',
    btnLg: 'text-lp-base px-5 h-[42px] font-semibold rounded-lp-lg',
    btnFull: 'w-full',

    // ── Links ──────────────────────────────────────────────────────
    link: 'text-slate-400 no-underline transition-colors duration-lp-fast hover:text-slate-600 hover:underline underline-offset-[3px] decoration-[1px] focus-visible:outline-2 focus-visible:outline-amber-400 focus-visible:outline-offset-1 rounded-lp-sm',
    linkItem: 'text-slate-400 no-underline font-medium hover:text-slate-600 hover:underline underline-offset-[2px]',
    linkUrl:
        'font-mono text-lp-sm text-slate-400 no-underline break-all hover:text-slate-600 hover:underline underline-offset-[3px]',
    linkAction:
        'inline-flex items-center gap-1 font-ui text-lp-sm font-medium text-amber-400 no-underline transition-colors duration-lp-fast hover:text-amber-600',
    linkSubtle:
        'font-ui text-lp-sm text-charcoal-300 no-underline transition-colors duration-lp-fast hover:text-charcoal-500 hover:underline underline-offset-[3px]',
    linkUtility:
        'inline-flex items-center gap-1 font-ui text-lp-sm font-medium text-slate-400 no-underline transition-colors duration-lp-fast hover:text-slate-600',
    navLink:
        'flex items-center gap-2 px-2 py-[5px] rounded-lp-md font-ui text-lp-sm font-normal text-charcoal-300 no-underline transition-all duration-lp-fast hover:text-charcoal-100 hover:bg-charcoal-800',
    navLinkActive: 'text-amber-400 font-medium hover:bg-amber-400/[0.08]',

    // ── Forms ──────────────────────────────────────────────────────
    input: 'w-full h-9 font-ui text-lp-sm text-charcoal-950 bg-white border border-[0.5px] border-stone-300 rounded-lp-md px-[10px] outline-none transition-colors duration-lp-fast hover:border-stone-500 focus:border-amber-400 placeholder:text-charcoal-300',
    cellInput:
        'font-ui text-lp-sm text-charcoal-950 bg-transparent border border-[0.5px] border-transparent rounded-lp-sm px-[6px] py-[3px] outline-none w-full transition-all duration-lp-fast focus:bg-white focus:border-amber-400',
    select: 'h-[30px] font-ui text-lp-sm text-charcoal-950 bg-white border border-[0.5px] border-stone-300 rounded-lp-sm px-[6px] outline-none cursor-pointer transition-colors duration-lp-fast focus:border-amber-400',
    textarea:
        'w-full font-ui text-lp-sm text-charcoal-950 bg-white border border-[0.5px] border-stone-300 rounded-lp-md p-[10px] outline-none resize-y min-h-[80px] leading-relaxed transition-colors duration-lp-fast focus:border-amber-400 placeholder:text-charcoal-300',
    formLabel: 'block font-ui text-lp-xs font-medium tracking-[0.04em] text-charcoal-500 mb-[5px]',
};

module.exports = { lpTheme, tw };
