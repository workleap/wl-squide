import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["tests/**/*.test.{ts,tsx}"],
        exclude: ["node_modules", "dist"],
        reporters: "verbose",
        // Vitest 5 clears mocks after every test by default. The tests of this package are concurrent,
        // so a test that completes would wipe the mocks of the sibling tests still running.
        clearMocks: false
    },
    cacheDir: "./node_modules/.cache/vitest"
});
