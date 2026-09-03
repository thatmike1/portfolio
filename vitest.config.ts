import { defineConfig } from "vitest/config";

// the app's vite.config.ts carries the tanstack start + nitro plugins, which
// try to boot a server under vitest; the unit tests only need plain ts
export default defineConfig({
    test: { include: ["src/**/*.test.ts"] },
});
