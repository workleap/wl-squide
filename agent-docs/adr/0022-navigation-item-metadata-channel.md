# ADR-0022: Separate Metadata Channel on Navigation Items

## Status

proposed

## Context

`$additionalProps` on navigation items served two incompatible purposes. The reference documentation described it as a forwarding channel — "additional props to apply to the link component" — while the essentials guide used it as a metadata bag that the renderer had to strip before forwarding, registering `$additionalProps: { highlight: true }` and destructuring `highlight` out with `additionalProps: { highlight, ...additionalProps }`.

A single untyped bag therefore carried both "props to spread onto the component" and "data for the renderer to read", with the split being per-key, implicit, and known only to whoever wrote the registration. Nothing typed or validated which keys were forwardable.

The failure mode is silent and acts at a distance: a module adds a key to `$additionalProps`, and a renderer written earlier in a different package starts emitting it as a DOM attribute. Neither side changed. React only warns in development, and only for unrecognised props — invalid attributes still ship. This was hit in `wl-app`, where an object-valued metadata field rendered as `<a commandmenu="[object Object]" href="/teams">` on every top-nav anchor. Both the registration and the renderer were individually reasonable and consistent with the documentation.

## Options Considered

1. **Document a convention** — For example, prefix metadata keys with `_`. Still unenforced, and leaves the reference and essentials documentation contradicting each other.
2. **Type `$additionalProps` per item** — Doesn't help. The problem is the boundary between two concerns, not the absence of types on one bag. Tightening `$additionalProps` to `LinkProps` would also be a breaking change, since hosts legitimately pass design system props through it.
3. **Have consumers never spread `$additionalProps`** — What `wl-app` did downstream. Means every Squide application quietly diverges from the documented pattern, and the rule is not self-enforcing.
4. **Add a sibling `$meta` field whose contract is "read, never forward"** — Purely additive. `$additionalProps` then means exactly what the reference documentation already says, with no per-key exceptions.

## Decision

Option 4. `NavigationLink` and `NavigationSection` carry both `$additionalProps` (spread onto the rendered component) and `$meta` (read by the renderer, never spread). `useRenderedNavigationItems` surfaces them as `additionalProps` and `meta` on `NavigationLinkRenderProps` and `NavigationSectionRenderProps`, both defaulting to `{}` so renderers can destructure unconditionally.

Both stay `Record<string, unknown>`. A `NavigationLink<TMeta>` generic would propagate through `NavigationItem`, `NavigationSection`, `RootNavigationItem`, `NavigationItemRegistry`, the registration scopes, and `registerNavigationItem`, and the shape cannot be known at the registration site anyway — the renderer, usually in a different package, owns the contract.

`$meta` was not added to route types. Routes have no forwarding contract, and React Router ignores unknown keys on route objects rather than spreading them onto the DOM.

Alongside this, `toLinkProps` in `packages/react-router/src/useRenderedNavigationItems.tsx` now strips every `$`-prefixed key generically instead of by named destructuring. The previous named-omit plus rest-spread meant any `$`-prefixed property not listed in the destructuring leaked into `linkProps` and onto the DOM — adding `$meta` without touching that function would have reproduced the exact bug this ADR fixes. The generic strip also fixes a pre-existing leak: `$priority` was omitted only for root items, so a nested item carrying one leaked.

Note that the generic strip does *not* fix the reported bug on its own — `commandMenu` lived inside `$additionalProps` and was never `$`-prefixed. `$meta` fixes the contract; the generic strip removes the maintenance hazard. They are independent.

## Consequences

- `$additionalProps` has a single, enforceable meaning: everything in it is spread. There are no per-key exceptions for a renderer to remember.
- Backward compatible. `$meta` is optional and existing `$additionalProps` behaviour is untouched, so existing items keep working unchanged.
- The contract is expressed in the type, but not enforced by it. A consumer can still put a non-forwardable value in `$additionalProps`; the documentation now consistently tells them not to.
- Adding a new `$`-prefixed property no longer requires updating the stripping logic, which retires the sync hazard recorded in [ADR-0018](./0018-dollar-prefix-convention.md).
- An unknown `$`-prefixed property is now dropped rather than forwarded. `NavigationLink` has no index signature, so a fresh object literal carrying one is an excess-property error, but that check doesn't apply through an intermediate variable — items built by a helper can carry one without a cast. A consumer relying on such a property reaching the component (a styled-components transient prop, for instance) would break. No such usage exists in this repository.
- `toLinkProps` now allocates an entries array, a filtered array, and a result object per link, each time the `useMemo` recomputes rather than on every render.
- Symbol-keyed properties are now dropped where the rest-spread forwarded them. Irrelevant for navigation items, but it is the one genuine semantic difference from the previous stripping.
