import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "happy-dom",
        include: ["tests/**/*.test.{ts,tsx}"],
        exclude: ["node_modules", "dist"],
        // Vitest 5 clears all mocks between tests by default, which races with "test.concurrent".
        clearMocks: false,
        reporters: "verbose"
    },
    cacheDir: "./node_modules/.cache/vitest",
    plugins: [react()]
});
