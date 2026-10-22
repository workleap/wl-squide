import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["tests/**/*.test.{ts,tsx}"],
        exclude: ["node_modules", "dist"],
        // Vitest 5 clears all mocks between tests by default, which races with "test.concurrent".
        clearMocks: false,
        reporters: "verbose"
    },
    cacheDir: "./node_modules/.cache/vitest"
});
