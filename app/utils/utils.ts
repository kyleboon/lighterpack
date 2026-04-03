import { MgToWeight } from '#shared/utils/weight';
import type { WeightUnit } from '#shared/types';
import { getCsrfToken } from './csrf';

interface ErrorResponse {
    message?: string;
    errors?: Array<{ message: string }>;
    data?: {
        errors?: Array<{ message: string }>;
    };
}

interface FetchOptions extends RequestInit {
    headers: Record<string, string>;
}

class lpError extends Error {
    statusCode: number | null;
    errors: Array<{ message: string }> | null;
    id: string | null;
    metadata: unknown;

    constructor(response: ErrorResponse, statusCode: number | null = null) {
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

        // Structured errors from H3's data field or direct errors array
        if (response.data && response.data.errors instanceof Array) {
            this.errors = response.data.errors;
        } else if (response.errors) {
            this.errors = response.errors;
        }
    }
}

export const fetchJson = (url: string, options?: Partial<FetchOptions>): Promise<unknown> => {
    const fetchOptions: FetchOptions = {
        method: 'GET',
        headers: {},
    };

    if (options) {
        Object.assign(fetchOptions, options);
    }

    const csrfToken = getCsrfToken();
    if (csrfToken) {
        fetchOptions.headers['X-CSRF-Token'] = csrfToken;
    }

    if (!fetchOptions.body && !fetchOptions.headers['Content-Type']) {
        fetchOptions.headers['Content-Type'] = 'application/json';
    }

    function parseJSON(response: Response) {
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
            .then((response: unknown) => {
                const res = response as { ok: boolean; status: number; json: ErrorResponse };
                if (res.ok) {
                    return resolve(res.json);
                }
                if (res.status && (res.status === 401 || res.status === 403)) {
                    navigateTo('/welcome');
                    return undefined;
                }

                if (res.json) {
                    return reject(new lpError(res.json, res.status));
                }

                return reject(new lpError(res as ErrorResponse));
            })
            .catch((err) => {
                const wrappedErr = err && err instanceof TypeError && err.message === 'Failed to fetch' ? {} : err;
                return reject(new lpError(wrappedErr));
            });
    });
};

// Display helper functions — defined as plain functions for SSR compatibility,
// then attached to window for legacy code that expects globals.
export function displayWeight(mg: number, unit: WeightUnit): number | string {
    return MgToWeight(mg, unit) || 0;
}

export function displayPrice(price: number | undefined, symbol: string): string {
    let amount = '0.00';
    if (typeof price === 'number') {
        amount = price.toFixed(2);
    }
    return symbol + amount;
}

declare global {
    interface Window {
        readCookie: (name: string) => string | null;
        createCookie: (name: string, value: string, days?: number) => void;
        getElementIndex: (node: Element) => number;
        arrayMove: <T>(inputArray: T[], oldIndex: number, newIndex: number) => T[];
        displayWeight: typeof displayWeight;
        displayPrice: typeof displayPrice;
    }
}

// Browser-only globals — skip during SSR
if (typeof window !== 'undefined') {
    window.readCookie = function (name: string): string | null {
        const nameEQ = `${name}=`;
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    };

    window.createCookie = function (name: string, value: string, days?: number): void {
        let expires = '';
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
            expires = `; expires=${date.toUTCString()}`;
        }
        document.cookie = `${name}=${value}${expires}; path=/`;
    };

    window.getElementIndex = function (node: Element): number {
        let index = 0;
        let currentNode: Element | null = node;
        while ((currentNode = currentNode.previousElementSibling)) {
            index++;
        }
        return index;
    };

    window.arrayMove = function <T>(inputArray: T[], oldIndex: number, newIndex: number): T[] {
        const array = inputArray.slice();
        const element = array[oldIndex];
        array.splice(oldIndex, 1);
        array.splice(newIndex, 0, element);
        return array;
    };

    window.displayWeight = displayWeight;
    window.displayPrice = displayPrice;
}
