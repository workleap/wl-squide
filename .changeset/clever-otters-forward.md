---
"@squide/react-router": minor
"@squide/firefly": minor
---

An item's `$priority` is forwarded to the code rendering the menu again, at every depth, and is now declared on the item types themselves.

## The regression

`$priority` has two jobs. Squide sorts a menu's **top-level** items with it, and it is handed to the code rendering the menu so that code can order a section's items itself. The second job stopped working.

`useRenderedNavigationItems` used to spread a link item's remaining props into `linkProps` untouched, so a `$priority` arrived at the renderer as `linkProps.$priority`. When `$meta` was added, `toLinkProps` started filtering every `$` prefixed prop out of `linkProps` — correctly, since those are not valid props for a `Link` component and leak onto the DOM element as invalid attributes — and `$priority` went out with them. `toMenuProps` never forwarded it at all. A renderer had no way to read a nested item's priority.

## What changes

- `NavigationLinkRenderProps` and `NavigationSectionRenderProps` gain a `priority?: number`. It is the item's `$priority` exactly as declared, `undefined` included, so an unset priority can be told apart from an explicit `0`. Squide's own top-level sort still treats a missing priority as `0`.
- `$priority` moves from `RootNavigationItem` onto `NavigationLink` and `NavigationSection`, so it is legal at any depth. Writing one inside a `children` literal used to be a `TS2353` excess-property error even though the registry carried a nested item's `$priority` through verbatim.
- `RootNavigationItem` becomes an alias of `NavigationItem`. Every signature naming it keeps working, and it still reads as "the root of a menu".

Nothing about sorting changes. `useRenderedNavigationItems` sorts the array it receives and renders a section's `children` in declaration order, as it always has. What is restored is the renderer's ability to see the priority and act on it.

```tsx
const renderLinkItem: RenderLinkItemFunction = ({ label, linkProps, priority }, key) => {
    return (
        <li key={key} data-priority={priority}>
            <Link {...linkProps}>{label}</Link>
        </li>
    );
};
```

The documentation for `$priority` said the prop was scoped to top-level items and ignored elsewhere. That described the regression rather than the design, and has been corrected.
