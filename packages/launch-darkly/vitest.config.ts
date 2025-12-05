import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "happy-dom",
        include: ["tests/**/*.test.{ts,tsx}"],
        exclude: ["node_modules", "dist"],
        setupFiles: ["./vitest-setup.ts"],
        reporters: "verbose"
    },
    cacheDir: "./node_modules/.cache/vitest",
    plugins: [react()]
});
