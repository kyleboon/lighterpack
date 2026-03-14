'use strict';

const colorUtils = require('../client/utils/color.js');
const weightUtils = require('../client/utils/weight.js');

const CX = 130;
const CY = 130;
const INNER = 70;
const OUTER = 120;

function segmentPath(innerR, outerR, startAngle, endAngleIn) {
    const endAngle = endAngleIn - startAngle >= Math.PI * 2 ? startAngle + Math.PI * 2 - 0.0001 : endAngleIn;
    const x1 = CX + outerR * Math.cos(startAngle);
    const y1 = CY + outerR * Math.sin(startAngle);
    const x2 = CX + outerR * Math.cos(endAngle);
    const y2 = CY + outerR * Math.sin(endAngle);
    const x3 = CX + innerR * Math.cos(endAngle);
    const y3 = CY + innerR * Math.sin(endAngle);
    const x4 = CX + innerR * Math.cos(startAngle);
    const y4 = CY + innerR * Math.sin(startAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
}

function esc(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Generate a static SVG donut chart for the given library's default list.
 * @param {object} library - Library instance (client/dataTypes.js Library)
 * @returns {string} SVG markup string, or empty string if no data
 */
function renderChartSvg(library) {
    const list = library.getListById(library.defaultListId);
    if (!list) return '';

    const slices = [];
    let totalWeight = 0;

    for (let i = 0; i < list.categoryIds.length; i++) {
        const category = library.getCategoryById(list.categoryIds[i]);
        if (!category) continue;
        category.calculateSubtotal();
        if (category.subtotalWeight > 0) {
            slices.push({ category, index: i });
            totalWeight += category.subtotalWeight;
        }
    }

    if (!totalWeight || !slices.length) return '';

    let paths = '';
    let angle = -Math.PI / 2;
    for (const { category, index } of slices) {
        const catColor = category.color || colorUtils.getColor(index);
        const fill = colorUtils.rgbToString(catColor);
        const span = (category.subtotalWeight / totalWeight) * 2 * Math.PI;
        const d = segmentPath(INNER, OUTER, angle, angle + span);
        const weight = `${weightUtils.MgToWeight(category.subtotalWeight, library.totalUnit)} ${library.totalUnit}`;
        paths += `<path d="${d}" fill="${fill}" stroke="#f5f5f5" stroke-width="2" class="lp-donut-slice"><title>${esc(category.name)}: ${esc(weight)}</title></path>`;
        angle += span;
    }

    return `<svg class="lp-chart" viewBox="0 0 260 260" width="260" height="260">${paths}</svg>`;
}

module.exports = { renderChartSvg };
