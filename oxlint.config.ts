import { defineConfig } from "oxlint";

export default defineConfig({
    ignorePatterns: ["templates/**", "**/mockServiceWorker.js"],
    // Setting `plugins` overwrites oxlint's default plugin set (eslint, typescript, unicorn, oxc),
    // so the defaults must be listed explicitly alongside the extras.
    plugins: ["eslint", "typescript", "unicorn", "oxc", "react", "import", "jsx-a11y", "promise", "vitest"],
    options: { typeAware: true },
    categories: {
        suspicious: "warn",
        perf: "warn"
    },
    rules: {
        // Packages expose their public API through a src/index.ts barrel.
        "oxc/no-barrel-file": "off",
        // It replaces a spread by Object.assign, which mutates the source object rather than cloning it.
        "oxc/no-map-spread": "off",
        "unicorn/consistent-function-scoping": "off",
        "eslint/array-callback-return": "warn",
        "eslint/curly": "warn",
        "eslint/eqeqeq": ["warn", "smart"],
        "eslint/no-caller": "warn",
        "eslint/no-console": "off",
        "eslint/no-eval": "warn",
        "eslint/no-extend-native": "warn",
        "eslint/no-extra-bind": "warn",
        "eslint/no-lone-blocks": "warn",
        "eslint/no-loop-func": "warn",
        "eslint/no-new-wrappers": "warn",
        "eslint/no-param-reassign": "warn",
        "eslint/no-script-url": "warn",
        "eslint/no-self-compare": "warn",
        "eslint/no-sequences": "warn",
        "eslint/no-template-curly-in-string": "warn",
        "eslint/no-throw-literal": "warn",
        // Private members use a leading underscore (`_runtime`).
        "eslint/no-underscore-dangle": "off",
        "eslint/no-unneeded-ternary": "warn",
        "eslint/no-useless-computed-key": "warn",
        "eslint/no-useless-concat": "warn",
        "eslint/no-useless-constructor": "warn",
        "eslint/no-useless-rename": "warn",
        "eslint/no-var": "warn",
        "eslint/prefer-const": "warn",
        "import/no-cycle": "warn",
        "import/no-duplicates": "warn",
        "import/no-self-import": "warn",
        "import/no-unassigned-import": "off",
        "react/button-has-type": "warn",
        "react/jsx-key": "warn",
        "react/jsx-no-constructed-context-values": "warn",
        "react/jsx-no-duplicate-props": "warn",
        "react/no-array-index-key": "warn",
        "react/react-in-jsx-scope": "off",
        "react/rules-of-hooks": "warn",
        "react/exhaustive-deps": "warn",
        "react/set-state-in-effect": "off",
        "react-perf/jsx-no-new-function-as-prop": "off",
        "typescript/ban-ts-comment": "error",
        "typescript/consistent-type-imports": ["warn", { fixStyle: "inline-type-imports" }],
        "typescript/no-empty-object-type": ["error", { allowInterfaces: "with-single-extends" }],
        "typescript/no-import-type-side-effects": "error",
        "typescript/no-explicit-any": "warn",
        "typescript/no-unsafe-type-assertion": "off",
        "typescript/consistent-return": "off",
        "typescript/no-misused-promises": ["warn", { checksVoidReturn: { attributes: false } }],
        "typescript/return-await": "warn",
        "typescript/switch-exhaustiveness-check": ["warn", { considerDefaultExhaustiveForUnions: true }],
        "typescript/use-unknown-in-catch-callback-variable": "warn",
        "vitest/require-mock-type-parameters": "off",
        "jsx-a11y/no-autofocus": "off",
        // Squide doesn't use the React Compiler; react/exhaustive-deps covers effect dependencies.
        "react/exhaustive-effect-dependencies": "off",
        // Public API generics are part of the contract even when a signature uses them once.
        "typescript/no-unnecessary-type-parameters": "off",
        "typescript/no-generated-empty-object-type": "off",
        // Their autofixes drop casts and type arguments that keep inferred types from widening to `any`.
        "typescript/no-unnecessary-type-assertion": "off",
        "typescript/no-unnecessary-type-arguments": "off",
        // A bare `export {}` is how a script file becomes a module under `isolatedModules`.
        "unicorn/require-module-specifiers": "off",
        // Samples label emojis with `<span role="img">`, which has no semantic tag equivalent.
        "jsx-a11y/prefer-tag-over-role": "off",
        // Log and error messages interpolate values as-is on purpose.
        "typescript/restrict-template-expressions": "off",
        "typescript/no-base-to-string": "off",
        // `String(eventName)` guards against symbol keys at runtime.
        "typescript/no-unnecessary-type-conversion": "off",
        // Module registration is sequential on purpose (see ADR-0006).
        "eslint/no-await-in-loop": "off",
        // `toSorted` isn't available on every browser consumers target.
        "unicorn/no-array-sort": "off",
        "promise/always-return": "off",
        "import/no-named-as-default-member": "off",
        "vitest/no-commented-out-tests": "off",
        "vitest/require-to-throw-message": "off"
    },
    overrides: [
        {
            files: ["*.stories.tsx"],
            rules: {
                "react-perf/jsx-no-jsx-as-prop": "off",
                "react-perf/jsx-no-new-object-as-prop": "off"
            }
        },
        {
            files: ["*.test.ts", "*.test.tsx"],
            rules: {
                "jest/no-conditional-expect": "off",
                "typescript/no-explicit-any": "off",
                // `expect(spy.method)` reads the method unbound by design.
                "typescript/unbound-method": "off",
                // Tests capture a rejection with `.catch(x => x)` to assert on its typed properties.
                "typescript/use-unknown-in-catch-callback-variable": "off"
            }
        }
    ]
});
