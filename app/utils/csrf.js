/**
 * Reads the CSRF token from the csrf_token cookie.
 * Returns null during SSR or if the cookie is not set.
 */
export function getCsrfToken() {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    return match ? match[1] : null;
}
