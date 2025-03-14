import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "happy-dom",
        include: ["tests/**/*.test.{ts,tsx}"],
        exclude: ["node_modules", "dist"],
        setupFiles: ["./vitest-setup.ts"],
        testTransformMode: {
            web: [".ts", ".tsx"]
        },
        reporters: "verbose"
    },
    define: {
        __webpack_share_scopes__: {
            default: {}
        }
    },
    cacheDir: "./node_modules/.cache/vitest",
    plugins: [react()]
});
