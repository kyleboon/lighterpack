export const fullUnitToUnit = {
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

export function CSVToArray(strData) {
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
