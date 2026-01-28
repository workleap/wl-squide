import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { StorybookConfig } from "storybook-react-rsbuild";

const require = createRequire(import.meta.url);

const storybookConfig: StorybookConfig = {
    framework: getAbsolutePath("storybook-react-rsbuild"),
    addons: [
        getAbsolutePath("@storybook/addon-a11y")
    ],
    core: {
        builder: {
            name: "storybook-builder-rsbuild",
            options: {
                // The "RuntimeError: factory is undefined" error was caused by Rsbuild's lazy compilation conflicting with top-level await in story files.
                // When lazy compilation is enabled, Rsbuild defers module compilation until requested. With top-level await, module dependencies (like react-dom) may not have their factory functions ready when needed, causing the error.
                // Event if "lazyCompilation" is already turned off in "@workleap/rsbuild-configs" Storybook config for rsbuild, it's possible that
                // Storybook or "storybook-react-rsbuild" turn it on.
                lazyCompilation: false
            }
        }
    },
    stories: [
        "../host/src/**/*.stories.tsx"
    ],
    staticDirs: ["public"]
    // rsbuildFinal: config => {
    //     return mergeRsbuildConfig(config, {
    //         dev: {
    //             // The "RuntimeError: factory is undefined" error was caused by Rsbuild's lazy compilation conflicting with top-level await in story files.
    //             // When lazy compilation is enabled, Rsbuild defers module compilation until requested. With top-level await, module dependencies (like react-dom) may not have their factory functions ready when needed, causing the error.
    //             // Event if "lazyCompilation" is already turned off in "@workleap/rsbuild-configs" Storybook config for rsbuild, it's possible that
    //             // Storybook turn it on.
    //             lazyCompilation: false
    //         }
    //     });
    // }
};

export default storybookConfig;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAbsolutePath(value: string): any {
    return dirname(require.resolve(join(value, "package.json")));
}
