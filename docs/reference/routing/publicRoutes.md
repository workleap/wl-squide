---
order: 101
toc:
    depth: 2-3
---

# PublicRoutes

A placeholder indicating where in the routing tree should the public routes be rendered. The `PublicRoutes` placeholder concept is similar to React Router's [outlet](https://reactrouter.com/en/main/components/outlet), it's a pipeline to inject routes at a predetermined location.

> A public route is a route with a `"public"` visibility that is not [hoisted](../runtime/FireflyRuntime.md#register-an-hoisted-route) or nested with either a [parentPath](../runtime/FireflyRuntime.md#register-nested-routes) or [parentId](../runtime/FireflyRuntime.md#register-a-route-with-an-id) option.

## Reference

```tsx
<PublicRoutes />
```

### Properties

None

## Usage

The route defining the `PublicRoutes` placeholder must be [hoisted](../runtime/FireflyRuntime.md#register-an-hoisted-route); otherwise, there will be an infinite loop as the `PublicRoutes` placeholder will render within itself.

```tsx !#8,11
import { PublicRoutes } from "@squide/firefly";
import { RootLayout } from "./RootLayout.tsx";

runtime.registerRoute({
    // Pathless route to declare a root layout.
    element: <RootLayout />,
    children: [
        PublicRoutes
    ]
}, {
    hoist: true
});
```
