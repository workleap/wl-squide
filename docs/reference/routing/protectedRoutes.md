---
order: 100
toc:
    depth: 2-3
---

# ProtectedRoutes

A placeholder indicating where in the routing tree should the protected routes be rendered. The `ProtectedRoutes` placeholder concept is similar to React Router's [outlet](https://reactrouter.com/en/main/components/outlet), it's a pipeline to inject routes at a predetermined location.

> A protected route is a route with a `"protected"` visibility that is not [hoisted](../runtime/FireflyRuntime.md#register-an-hoisted-route) or nested with either a [parentPath](../runtime/FireflyRuntime.md#register-nested-routes) or [parentId](../runtime/FireflyRuntime.md#register-a-route-with-an-id) option.

## Reference

```tsx
<ProtectedRoutes />
```

### Properties

None

## Usage

The route defining the `ProtectedRoutes` placeholder must be [hoisted](../runtime/FireflyRuntime.md#register-an-hoisted-route); otherwise, there will be an infinite loop as the `ProtectedRoutes` placeholder will render within itself.

```tsx !#8,11 shell/src/register.tsx
import { ProtectedRoutes } from "@squide/firefly";
import { RootLayout } from "./RootLayout.tsx";

runtime.registerRoute({
    // Pathless route to declare a root layout.
    element: <RootLayout />,
    children: [
        ProtectedRoutes
    ]
}, {
    hoist: true
});
```
