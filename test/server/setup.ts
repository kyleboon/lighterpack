// Nitro auto-imports helpers like `defineSitemapEventHandler` at build time.
// In the test environment there is no auto-import, so we inject the needed
// globals here to match the runtime Nitro context.
(globalThis as unknown as { defineSitemapEventHandler: (fn: unknown) => unknown }).defineSitemapEventHandler = (
    fn: unknown,
) => fn;
