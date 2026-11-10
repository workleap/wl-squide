# Stylelint Configuration

## Overview

`@workleap/stylelint-configs` provides Stylelint configurations for CSS linting. Uses Prettier for stylistic rules via stylelint-prettier plugin.

**No SCSS support**: The library does not provide Sass rules. Use native CSS nesting instead.

## Installation

### Polyrepo

```bash
pnpm add -D @workleap/stylelint-configs stylelint prettier
```

### Turborepo (Workspace Root)

```bash
pnpm add -D @workleap/stylelint-configs stylelint prettier turbo
```

### Turborepo (Project)

```bash
pnpm add -D @workleap/stylelint-configs
```

## Configuration

### .stylelintrc.json

```json
{
    "$schema": "https://json.schemastore.org/stylelintrc",
    "extends": "@workleap/stylelint-configs"
}
```

### .stylelintignore

```text
**/dist/*
node_modules
storybook-static
!.storybook
```

### .prettierrc.json5

stylelint-prettier formats CSS with Prettier, while oxfmt formats the rest of the code and ignores CSS. Prettier does not read `oxfmt.config.ts`, so add a CSS-scoped config with the same options at the root (workspace root for Turborepo):

```json5
// .prettierrc.json5
{
    $schema: "https://json.schemastore.org/prettierrc",
    overrides: [
        {
            files: "*.css",
            options: {
                printWidth: 150,
                tabWidth: 4,
                useTabs: false,
                singleQuote: false,
                endOfLine: "lf"
            }
        }
    ]
}
```

Do NOT add a `.prettierignore` that ignores everything except CSS (`*` / `!**/*.css`): oxfmt also reads `.prettierignore` and would skip every file, and `*` also ignores folders, so Prettier skips the CSS files in subfolders. If a project already has one, remove it (or remove its CSS-only patterns) and rely on `.prettierrc.json5` instead.

## Customization

### Disable a Rule

```json
{
    "$schema": "https://json.schemastore.org/stylelintrc",
    "extends": "@workleap/stylelint-configs",
    "rules": {
        "color-hex-length": null
    }
}
```

### Change Rule Severity

```json
{
    "$schema": "https://json.schemastore.org/stylelintrc",
    "extends": "@workleap/stylelint-configs",
    "rules": {
        "max-nesting-depth": [2, { "severity": "error" }]
    }
}
```

### Change Rule Value

```json
{
    "$schema": "https://json.schemastore.org/stylelintrc",
    "extends": "@workleap/stylelint-configs",
    "rules": {
        "unit-allowed-list": ["rem"]
    }
}
```

### Add a Plugin

```json
{
    "$schema": "https://json.schemastore.org/stylelintrc",
    "plugins": ["stylelint-order"],
    "extends": "@workleap/stylelint-configs",
    "rules": {
        "order/properties-order": ["width", "height"]
    }
}
```

## CLI Scripts

### Polyrepo

```json
{
    "lint:stylelint": "stylelint \"**/*.css\" --cache --cache-location node_modules/.cache/stylelint"
}
```

### Turborepo Workspace

```json
{
    "lint": "turbo run lint --continue"
}
```

### Turborepo Project

```json
{
    "stylelint": "stylelint \"**/*.css\" --allow-empty-input --cache --cache-location node_modules/.cache/stylelint --max-warnings=0"
}
```

## Turborepo Configuration

```json
// turbo.json
{
    "$schema": "https://turbo.build/schema.json",
    "ui": "tui",
    // .prettierrc.json5 configures Stylelint in every project: a change to it must run Stylelint again everywhere.
    "globalDependencies": [".prettierrc.json5"],
    "tasks": {
        "lint": { "dependsOn": ["stylelint"] },
        "stylelint": { "outputs": ["node_modules/.cache/stylelint"] }
    }
}
```

## EditorConfig (Recommended)

For consistent indentation across Prettier and VS Code:

```ini
# .editorconfig
root = true

[*]
charset = utf-8
end_of_line = lf
trim_trailing_whitespace = true
insert_final_newline = true
indent_style = space
indent_size = 4

[*.md]
trim_trailing_whitespace = false

[*.{yml,yaml}]
indent_size = 2
```

Install `EditorConfig.EditorConfig` VS Code extension.

## VS Code Integration

Install `stylelint.vscode-stylelint` extension.

```json
// .vscode/settings.json
{
    "editor.codeActionsOnSave": {
        "source.fixAll": "explicit"
    },
    "editor.formatOnSave": true,
    "css.validate": false,
    "scss.validate": false
}
```
