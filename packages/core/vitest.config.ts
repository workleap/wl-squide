import react from "@vitejs/plugin-react";
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
    cacheDir: "./node_modules/.cache/vitest",
    plugins: [react()]
});
