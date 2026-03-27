import weightUtils from '#shared/utils/weight.js';

class lpError extends Error {
    constructor(response, statusCode = null) {
        super();

        this.message = 'An error occurred, please try again later.';
        this.statusCode = statusCode;
        this.errors = null;
        this.id = null;
        this.metadata = null;

        if (response.message) {
            this.message = response.message;
        } else if (
            response.errors &&
            response.errors instanceof Array &&
            response.errors.length &&
            response.errors[0].message
        ) {
            this.message = response.errors[0].message;
        }

        if (response.errors) {
            this.errors = response.errors;
        }
    }
}

export const fetchJson = (url, options) => {
    const fetchOptions = {
        method: 'GET',
        headers: {},
    };

    if (options) {
        Object.assign(fetchOptions, options);
    }

    if (!fetchOptions.body && !fetchOptions.headers['Content-Type']) {
        fetchOptions.headers['Content-Type'] = 'application/json';
    }

    function parseJSON(response) {
        return new Promise((resolve, reject) => {
            response
                .text()
                .then((text) => {
                    let json;

                    try {
                        json = text ? JSON.parse(text) : {};
                    } catch (_err) {
                        json = { message: response };
                    }

                    return resolve({
                        status: response.status,
                        ok: response.ok,
                        json,
                    });
                })
                .catch((err) => reject(err));
        });
    }

    return new Promise((resolve, reject) => {
        fetch(url, fetchOptions)
            .then(parseJSON)
            .then((response) => {
                if (response.ok) {
                    return resolve(response.json);
                }
                if (response.status && (response.status === 401 || response.status === 403)) {
                    navigateTo('/welcome');
                    return undefined;
                }

                if (response.json) {
                    return reject(new lpError(response.json, response.status));
                }

                return reject(new lpError(response));
            })
            .catch((err) => {
                const wrappedErr = err && err instanceof TypeError && err.message === 'Failed to fetch' ? {} : err;
                return reject(new lpError(wrappedErr));
            });
    });
};

// Display helper functions — defined as plain functions for SSR compatibility,
// then attached to window for legacy code that expects globals.
export function displayWeight(mg, unit) {
    return weightUtils.MgToWeight(mg, unit) || 0;
}

export function displayPrice(price, symbol) {
    let amount = '0.00';
    if (typeof price === 'number') {
        amount = price.toFixed(2);
    }
    return symbol + amount;
}

// Browser-only globals — skip during SSR
if (typeof window !== 'undefined') {
    window.readCookie = function (name) {
        const nameEQ = `${name}=`;
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    };

    window.createCookie = function (name, value, days) {
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
            var expires = `; expires=${date.toGMTString()}`;
        } else var expires = '';
        document.cookie = `${name}=${value}${expires}; path=/`;
    };

    window.getElementIndex = function (node) {
        let index = 0;
        let currentNode = node;
        while ((currentNode = currentNode.previousElementSibling)) {
            index++;
        }
        return index;
    };

    window.arrayMove = function (inputArray, oldIndex, newIndex) {
        const array = inputArray.slice();
        const element = array[oldIndex];
        array.splice(oldIndex, 1);
        array.splice(newIndex, 0, element);
        return array;
    };

    window.displayWeight = displayWeight;
    window.displayPrice = displayPrice;
}
