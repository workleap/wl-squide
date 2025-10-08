---
order: 940
label: Migrate to firefly v10.0
toc:
    depth: 2-3
---

# Migrate to firefly v10.0

!!!warning
If you are migrating from `v8.*`, follow the [Migrate from v8.* to v15.0](./migrate-from-v8-to-v15.0.md) guide.
!!!

This major version introduces support for [React Router](https://reactrouter.com) `v7`. The peer dependencies for `@squide/firefly` and `@squide/react-router` have been updated from `react-router-dom@6*` to `react-router@7*` and the React Router shared dependency name has been renamed from `react-router-dom` to `react-router` for `@squide/firefly-webpack-configs` and `@squide/firefly-rsbuild-configs`.

## Breaking changes

All breaking changes in firefly `v10` are due to the migration to React Router `v7`. For official guidance on upgrading from React Router `v6` to `v7`, refer to the official [migration guide](https://reactrouter.com/upgrading/v6).

If you are app is already on React Router `v7`, you don't have to deal with any breaking changes for firefly `v10`.

### React Router future flags

Before migrating to Squide firefly `v10` or React Router `v7`, it is highly recommended to read React Router [migration guide](https://reactrouter.com/upgrading/v6) and activate the "future flags" one by one to minimize breaking changes.

Before:

```tsx
<RouterProvider
    router={createBrowserRouter([
        {
            element: rootRoute,
            children: registeredRoutes
        }
    ])}
    {...routerProviderProps}
/>
```

Now:

```tsx
<RouterProvider
    router={createBrowserRouter([
        {
            element: rootRoute,
            children: registeredRoutes
        }
    ], {
        future: {
            v7_relativeSplatPath: true
        }
    })}
    {...routerProviderProps}
/>
```

If your application is already on React Router `v7`, you can ignore this advice.

### Replace `react-router-dom` with `react-router`

In React Router `v7`, `react-router-dom` is no longer required, as the package structure has been simplified. All necessary imports are now available from either `react-router` or `react-router/dom`.

#### Update dependencies

Open a terminal at the root of the project workspace and use the following commands to remove `react-router-dom` and install `react-router@latest`:

```bash
pnpm remove react-router-dom
pnpm add react-router@latest
```

#### Update Imports

In your code, update all imports from `react-router-dom` to `react-router`, except for `RouterProvider`, which must be imported from `react-router/dom`.

Before:

```ts
import { Outlet, createBrowserRouter, RouterProvider } from "react-router-dom";
```

Now:

```ts
import { Outlet, createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
```

According to React Router [migration guide](https://reactrouter.com/upgrading/v6#upgrade-to-v7), you can use the following command to update the imports from `react-router-dom` to `react-router`:

```bash
find ./path/to/src \( -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.jsx" \) -type f -exec sed -i '' 's|from "react-router-dom"|from "react-router"|g' {} +
```
