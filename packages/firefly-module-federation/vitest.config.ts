import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "happy-dom",
        include: ["tests/**/*.test.{ts,tsx}"],
        exclude: ["node_modules", "dist"],
        setupFiles: ["./vitest-setup.ts"],
        reporters: "verbose",
        // Vitest 5 clears mocks after every test by default. The tests of this package are concurrent,
        // so a test that completes would wipe the mocks of the sibling tests still running.
        clearMocks: false
    },
    define: {
        __webpack_share_scopes__: {
            default: {}
        }
    },
    cacheDir: "./node_modules/.cache/vitest",
    plugins: [react()]
});
