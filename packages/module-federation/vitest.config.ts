import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["tests/**/*.test.{ts,tsx}"],
        exclude: ["node_modules", "dist"],
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
    cacheDir: "./node_modules/.cache/vitest"
});
