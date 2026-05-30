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
    resolve: {
        dedupe: ["react", "react-dom", "react-router"],
        alias: {
            // "react-router" and "react-router/dom" are separate entry points that each carry their own copy
            // of the router context when bundled by Vitest. The decorator imports "RouterProvider" from
            // "react-router/dom" while "@squide/firefly" reads the context through "react-router" hooks (e.g.
            // "useLocation" in "RootRoute"), so the two don't match and rendering throws
            // "useLocation() may be used only in the context of a <Router> component.". Aliasing the subpath to
            // the main entry (which also exports "RouterProvider") unifies them. Test-only; production bundlers dedupe this.
            "react-router/dom": "react-router"
        }
    },
    cacheDir: "./node_modules/.cache/vitest",
    plugins: [react()]
});
