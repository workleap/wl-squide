# ADR-0024: Dollar-Prefix Convention for Framework-Owned Properties

## Status

accepted

## Context

Squide extends React Router's route and navigation item types (`IndexRouteObject`, `NonIndexRouteObject`, `LinkProps`) with framework-specific metadata such as identifiers, visibility, labels, and rendering hints. These extended properties coexist with React Router's native properties on the same objects. A future React Router release could introduce a property name that collides with a Squide property, causing silent breakage.

## Options Considered

1. **No prefix** — Use plain names like `id`, `visibility`, `label`. Risk of collision with current or future React Router properties (React Router already uses `id` for its own route matching).
2. **Nested namespace object** — Group Squide properties under a `squide: { ... }` sub-object. Verbose to access and breaks the flat property ergonomics consumers expect.
3. **Dollar-prefix (`$`) convention** — Prefix all Squide-owned properties with `$`: `$id`, `$visibility`, `$label`, `$additionalProps`, `$canRender`, `$priority`, `$parentIndexPath`. The `$` is a legal JavaScript identifier character that clearly signals "framework metadata" and is unlikely to be adopted by React Router.

## Decision

Option 3. All Squide-specific properties on route and navigation item objects use the `$` prefix. When rendering, `$`-prefixed properties are explicitly stripped before passing props to React Router components.

Evidence: `packages/react-router/src/RouteRegistry.ts` (lines 16-27) defines `$id`, `$visibility`, `$parentIndexPath` on route types. `packages/react-router/src/NavigationItemRegistry.ts` (lines 6-21) defines `$id`, `$label`, `$additionalProps`, `$canRender` on navigation item types. The `useRenderedNavigationItems` hook destructures and strips all `$`-prefixed properties before passing `linkProps` to React Router's `Link` component.

## Consequences

- Zero risk of naming collision with current or future React Router properties.
- The `$` prefix provides a clear visual signal distinguishing framework metadata from router-native properties.
- Consumers must remember to use the `$` prefix when registering routes and navigation items.
- The stripping logic in `useRenderedNavigationItems` must be kept in sync with any new `$`-prefixed properties added.
