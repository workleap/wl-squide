import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["tests/**/*.test.{ts,tsx}"],
        exclude: ["node_modules", "dist"],
        // Vitest 5 turned "clearMocks" on by default. Since it clears every mock before each test, it wipes the
        // call history of the concurrent tests that are still in flight. Every test creates its own mocks anyway.
        clearMocks: false,
        reporters: "verbose"
    },
    cacheDir: "./node_modules/.cache/vitest",
    plugins: [react()]
});
