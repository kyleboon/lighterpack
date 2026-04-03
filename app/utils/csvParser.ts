import type { WeightUnit } from '#shared/types';

export const fullUnitToUnit: Record<string, WeightUnit> = {
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

const headerAliases: Record<string, string> = {
    'item name': 'name',
    category: 'category',
    desc: 'description',
    description: 'description',
    qty: 'qty',
    quantity: 'qty',
    weight: 'weight',
    unit: 'unit',
    url: 'url',
    price: 'price',
    worn: 'worn',
    consumable: 'consumable',
};

interface RawRow {
    [key: string]: string;
}

export interface ParsedRow {
    name: string;
    category: string;
    description: string;
    qty: number;
    weight: number;
    unit: WeightUnit;
    url: string;
    price: number;
    worn: number;
    consumable: boolean;
}

const TRUTHY_VALUES = new Set(['worn', 'consumable', 'true', 'yes', '1']);

function parseTruthy(value: string): boolean {
    return TRUTHY_VALUES.has((value || '').trim().toLowerCase());
}

function parsePrice(value: string): number {
    if (!value) return 0;
    const stripped = String(value).replace(/^[^0-9.-]+/, '');
    const parsed = parseFloat(stripped);
    return isNaN(parsed) ? 0 : parsed;
}

function isHeaderRow(row: string[]): boolean {
    let matches = 0;
    for (const cell of row) {
        if (headerAliases[cell.trim().toLowerCase()] !== undefined) {
            matches++;
        }
    }
    return matches >= 3;
}

function buildRowFromHeaders(row: string[], columnMap: (string | null)[]): RawRow {
    const obj: RawRow = {};
    for (const [index, field] of columnMap.entries()) {
        if (field) {
            obj[field] = row[index] ?? '';
        }
    }
    return obj;
}

function buildRowFromIndex(row: string[]): RawRow {
    return {
        name: row[0] ?? '',
        category: row[1] ?? '',
        description: row[2] ?? '',
        qty: row[3] ?? '',
        weight: row[4] ?? '',
        unit: row[5] ?? '',
    };
}

function normalizeRow(raw: RawRow): ParsedRow | null {
    const unit = fullUnitToUnit[(raw.unit || '').trim().toLowerCase()];
    if (!unit) return null;

    const qty = parseFloat(raw.qty);
    const weight = parseFloat(raw.weight);
    if (isNaN(qty) || isNaN(weight)) return null;

    const name = (raw.name || '').trim();
    if (!name) return null;

    return {
        name,
        category: (raw.category || '').trim(),
        description: (raw.description || '').trim(),
        qty,
        weight,
        unit,
        url: (raw.url || '').trim(),
        price: parsePrice(raw.price),
        worn: parseTruthy(raw.worn) ? 1 : 0,
        consumable: parseTruthy(raw.consumable),
    };
}

export function parseCSV(input: string): ParsedRow[] {
    const rows = CSVToArray(input);
    const result: ParsedRow[] = [];

    if (!rows.length) return result;

    let startIndex = 0;
    let columnMap: (string | null)[] | null = null;

    if (isHeaderRow(rows[0])) {
        columnMap = rows[0].map((cell) => headerAliases[cell.trim().toLowerCase()] || null);
        startIndex = 1;
    }

    for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 4) continue;

        const raw = columnMap ? buildRowFromHeaders(row, columnMap) : buildRowFromIndex(row);
        const normalized = normalizeRow(raw);
        if (normalized) {
            result.push(normalized);
        }
    }

    return result;
}

export function CSVToArray(strData: string): string[][] {
    const strDelimiter = ',';
    const arrData: string[][] = [[]];
    let arrMatches: RegExpExecArray | null = null;

    const objPattern = new RegExp(
        `(\\${strDelimiter}|\\r?\\n|\\r|^)` + '(?:"([^"]*(?:""[^"]*)*)"|' + `([^"\\${strDelimiter}\\r\\n]*))`,
        'gi',
    );

    while ((arrMatches = objPattern.exec(strData))) {
        const strMatchedDelimiter = arrMatches[1];
        if (strMatchedDelimiter.length && strMatchedDelimiter !== strDelimiter) {
            arrData.push([]);
        }

        let strMatchedValue: string;
        if (arrMatches[2]) {
            strMatchedValue = arrMatches[2].replace(new RegExp('""', 'g'), '"');
        } else {
            strMatchedValue = arrMatches[3];
        }

        arrData[arrData.length - 1].push(strMatchedValue);
    }

    return arrData;
}
