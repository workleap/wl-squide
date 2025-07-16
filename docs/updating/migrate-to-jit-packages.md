---
order: 740
label: Migrate to JIT packages
---

# Migrate to Just-In-Time packages

Using [Just-in-Time packages](https://www.shew.dev/monorepos/packaging/jit) is a great way to reduce the configuration complexity of your monorepo. Using a Just-In-Time package strategy allows you to directly consume TypeScript files from library projects into applications without having to pre-compile them. Instead, the applications themselves will compile the TypeScript packages at build time.

> For more information about Just-in-Time packages, refer to this [documentation](https://www.shew.dev/monorepos/packaging/jit).

To migrate your library projects (e.g., utility packages, shared packages, local modules, etc.) to JIT packages, based on your project type, execute the following steps :point_down:

## Internal package

### Remove packages

Open a terminal at the root of the host application project and remove the following packages:

```bash
pnpm remove -D @workleap/tsup-configs tsup nodemon
```

### Update files

```
library
├── src
├──── index.ts
├── tsup.build.ts  -->  X
├── tsup.dev.ts    -->  X
├── nodemond.json  -->  X
├── package.json
```

#### `package.json`

Open the `package.json` file and update the `exports` field to point to the library project's entry file. In this example, the entry file is `index.ts`.

Before:

```json package.json
"exports": {
    ".": {
        "import": "./dist/index.js",
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
    }
}
```

After:

```json package.json
"exports": "./src/index.ts"
```

#### `tsconfig.json`

Open the `tsconfig.json` file and remove the `compilerOptions.paths` entries for library projects that enabled are Just-In-Time.

Before:

```json !#4-9 tsconfig.json
{
    "extends": "@workleap/typescript-configs/library.json",
    "compilerOptions": {
        "paths": {
            "@squide/core": ["../core/src/index.ts"],
            "@squide/react-router": ["../react-router/src/index.ts"],
            "@squide/module-federation": ["../module-federation/src/index.ts"],
            "@squide/msw": ["../msw/src/index.ts"]
        }
    },
    "exclude": ["dist", "node_modules"]
}
```

After:

```json tsconfig.json
{
    "extends": "@workleap/typescript-configs/library.json",
    "exclude": ["dist", "node_modules"]
}
```

#### `tsup.build.ts`

Delete the `tsup.build.ts` file.

#### `tsup.dev.ts`

Delete the `tsup.dev.ts` file.

#### `nodemon.json` (optional)

Delete the `nodemon.json` file.

### Update scripts

Remove the `dev` and `build` scripts.

## Registry package

### Remove packages (optional)

Open a terminal at the root of the host application project and remove the following packages:

```bash
pnpm remove -D nodemon
```

### Update files

```
library
├── src
├──── index.ts
├── tsup.build.ts
├── tsup.dev.ts    -->  X
├── nodemond.json  -->  X
├── package.json
```

#### `package.json`

Open the `package.json` file and move the `export` field value to the [publishConfig](https://pnpm.io/package_json#publishconfig) field.

Before:

```json package.json
"publishConfig": {
    "access": "public",
    "provenance": true
}
```

After:

```json package.json
"publishConfig": {
    "access": "public",
    "provenance": true,
    "exports": {
        ".": {
            "import": "./dist/index.js",
            "types": "./dist/index.d.ts",
            "default": "./dist/index.js"
        }
    }
}
```

Then, update the `exports` field to point to the library project's entry file. In this example, the entry file is `index.ts`.

Before:

```json package.json
"exports": {
    ".": {
        "import": "./dist/index.js",
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
    }
}
```

After:

```json package.json
"exports": "./src/index.ts"
```

#### `tsconfig.json`

Open the `tsconfig.json` file and remove the `compilerOptions.paths` entries for library projects that enabled are Just-In-Time.

Before:

```json !#4-9 tsconfig.json
{
    "extends": "@workleap/typescript-configs/library.json",
    "compilerOptions": {
        "paths": {
            "@squide/core": ["../core/src/index.ts"],
            "@squide/react-router": ["../react-router/src/index.ts"],
            "@squide/module-federation": ["../module-federation/src/index.ts"],
            "@squide/msw": ["../msw/src/index.ts"]
        }
    },
    "exclude": ["dist", "node_modules"]
}
```

After:

```json tsconfig.json
{
    "extends": "@workleap/typescript-configs/library.json",
    "exclude": ["dist", "node_modules"]
}
```

#### `tsup.dev.ts`

Delete the `tsup.dev.ts` file.

#### `nodemon.json` (optional)

Delete the `nodemon.json` file.

### Update scripts

Remove the `dev` script.
