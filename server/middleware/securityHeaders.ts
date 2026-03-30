export default defineEventHandler((event) => {
    const headers = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' https://i.imgur.com data:",
            "connect-src 'self'",
            "frame-ancestors 'none'",
        ].join('; '),
    };

    for (const [name, value] of Object.entries(headers)) {
        setResponseHeader(event, name, value);
    }
});
