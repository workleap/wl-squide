# TypeScript Configuration

## Overview

`@workleap/typescript-configs` provides TypeScript configurations by project type. Focuses on **linting only**; bundlers handle transpilation.

**Target environment**: ESM, ESNext

## Available Configurations

| Config | Use Case |
|--------|----------|
| `web-application.json` | React web applications |
| `library.json` | Libraries (with or without React) |
| `monorepo-workspace.json` | Monorepo workspace root |

### Advanced Composition Pieces

| Config | Description |
|--------|-------------|
| `core.json` | Basic rules shared by all configs |
| `react.json` | React-specific rules |

## Installation

### Polyrepo

```bash
pnpm add -D @workleap/typescript-configs typescript
```

### Turborepo (Workspace Root)

```bash
pnpm add -D @workleap/typescript-configs typescript turbo
```

### Turborepo (Project)

```bash
pnpm add -D @workleap/typescript-configs typescript
```

## Configuration Examples

### Web Application

```json
// tsconfig.json
{
    "extends": ["@workleap/typescript-configs/web-application.json"],
    "exclude": ["dist", "node_modules"]
}
```

With Storybook:

```json
{
    "extends": ["@workleap/typescript-configs/web-application.json"],
    "include": ["**/*", ".storybook/*"],
    "exclude": ["dist", "node_modules"]
}
```

### Library

```json
// tsconfig.json
{
    "extends": ["@workleap/typescript-configs/library.json"],
    "exclude": ["dist", "node_modules"]
}
```

With Storybook:

```json
{
    "extends": ["@workleap/typescript-configs/library.json"],
    "include": ["**/*", ".storybook/*"],
    "exclude": ["dist", "node_modules", ".storybook/storybook-static"]
}
```

### Monorepo Workspace Root

```json
// tsconfig.json
{
    "extends": "@workleap/typescript-configs/monorepo-workspace.json",
    "exclude": ["packages", "node_modules"]
}
```

With Storybook:

```json
{
    "extends": "@workleap/typescript-configs/monorepo-workspace.json",
    "include": ["**/*", ".storybook/*"],
    "exclude": ["packages", "node_modules", ".storybook/storybook-static"]
}
```

## Customization

### Override a Compiler Option

```json
{
    "extends": ["@workleap/typescript-configs/web-application.json"],
    "compilerOptions": {
        "strict": false
    },
    "exclude": ["dist", "node_modules"]
}
```

### Non-ESM Projects (Migration)

To allow imports without file extensions during migration:

```json
{
    "extends": ["@workleap/typescript-configs/web-application.json"],
    "compilerOptions": {
        "moduleResolution": "Bundler",
        "module": "ESNext"
    },
    "exclude": ["dist", "node_modules"]
}
```

### Monorepo Path Mappings

For projects referencing other workspace packages without JIT packages:

```json
// packages/pkg-1/tsconfig.json
{
    "extends": "@workleap/typescript-configs/web-application.json",
    "compilerOptions": {
        "paths": {
            "@sample/components": ["../components/index.ts"],
            "@sample/utils": ["../utils/index.ts"]
        }
    },
    "exclude": ["dist", "node_modules"]
}
```

### Advanced: Custom Composition

For React projects needing custom setup:

```json
{
    "extends": "@workleap/typescript-configs/react",
    "compilerOptions": { /* custom options */ },
    "exclude": ["dist", "node_modules"]
}
```

For non-React projects:

```json
{
    "extends": "@workleap/typescript-configs/core",
    "compilerOptions": { /* custom options */ },
    "exclude": ["dist", "node_modules"]
}
```

## CLI Scripts

### Polyrepo

```json
{
    "lint:types": "tsc"
}
```

### Turborepo Workspace

```json
{
    "lint": "turbo run lint --continue",
    "typecheck": "tsc"
}
```

### Turborepo Project

```json
{
    "typecheck": "tsc"
}
```

## Turborepo Configuration

```json
// turbo.json
{
    "$schema": "https://turbo.build/schema.json",
    "ui": "tui",
    "tasks": {
        "lint": { "dependsOn": ["typecheck"] },
        "//#typecheck": { "outputs": ["node_modules/.cache/tsbuildinfo.json"] },
        "typecheck": { "outputs": ["node_modules/.cache/tsbuildinfo.json"] }
    }
}
```

## Migrate to TypeScript 7

TypeScript 7 is the TypeScript compiler rewritten in Go, shipped in the regular `typescript` package (`tsc`), with much faster type-checking. `@workleap/typescript-configs` supports both TypeScript 6 and 7.

### 1. Update packages

In every `package.json` that includes `typescript`:

```bash
pnpm add -D typescript@7 @workleap/typescript-configs@latest
```

TypeScript 7.0 ships **no JavaScript API**. Projects using a tool that calls the TypeScript API (e.g. tsup) must stay on TypeScript 6. Rsbuild and Rslib (including Rslib's declaration files) work with TypeScript 7.

### 2. Remove `@typescript/native-preview`

If the project used `tsgo`, TypeScript 7 replaces it:

```bash
pnpm remove @typescript/native-preview
```

Replace `tsgo` with `tsc` in the `typecheck` scripts:

```json
{
    "typecheck": "tsc"
}
```

Remove `@typescript/native-preview*` from `minimumReleaseAgeExclude` (`pnpm-workspace.yaml`) or `minimum-release-age-exclude` (`.npmrc`).

### 3. Update removed compiler options

TypeScript 7 removes options TypeScript 6 deprecated. `"moduleResolution": "node"` / `"node10"` fails with `error TS5108`: replace it with `"NodeNext"` (with `"module": "NodeNext"`, which still emits CommonJS for a `"type": "commonjs"` package) or `"Bundler"`. Remove `ignoreDeprecations`.

### 4. VS Code

Install the `TypeScriptTeam.native-preview` extension (TypeScript 7 language service, default once installed). Remove `"typescript.experimental.useTsgo"` and a `"typescript.tsdk"` pointing to `@typescript/native-preview`.
