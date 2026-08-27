---
"@squide/react-router": minor
"@squide/firefly": minor
---

An item's `$priority` is now handed to the code rendering the menu, at every depth, and is declared on the item types themselves.

## Why

`$priority` has always been consumed and then discarded. The hook sorted the array it received and stripped the property before recursing — `.map(({ $priority, ...itemProps }) => itemProps)`, with the comment "priority is intentionally omitted", from the first version of this package in May 2023 until the `$meta` channel replaced that strip with `stripMetadataProps`. The renderer was never given the value on purpose.

That was a reasonable design while a section's `children` were always one array literal written by one author, in one place: the order was already fully under that author's control, so there was nothing for a priority to resolve. The root array is different — it is assembled from independent modules that cannot see each other, and a numeric priority is the only way to get a deterministic order there.

The `sectionId` option changed that. A module can now nest an item into another module's section, which makes `children` a cross-module composition point too — the exact situation `$priority` exists for at the root. Modules register concurrently (`Promise.allSettled`), and deferred registrations run after data fetching, so the resulting order is not something any author controls. `$priority` was neither honored at that depth nor visible to the code rendering the menu, leaving no lever at all.

## What changes

- `NavigationLinkRenderProps` and `NavigationSectionRenderProps` gain a `priority?: number`. It is the item's `$priority` exactly as declared, `undefined` included, so an unset priority can be told apart from an explicit `0`. Squide's own top-level sort still treats a missing priority as `0`.
- `$priority` moves from `RootNavigationItem` onto `NavigationLink` and `NavigationSection`, so it is legal at any depth. Writing one inside a `children` literal used to be a `TS2353` excess-property error, even though the registry has always carried a nested item's `$priority` through verbatim.
- `RootNavigationItem` becomes an alias of `NavigationItem`. Every signature naming it keeps working, and it still reads as "the root of a menu".

```tsx
const renderLinkItem: RenderLinkItemFunction = ({ label, linkProps, priority }, key) => {
    return (
        <li key={key} data-priority={priority}>
            <Link {...linkProps}>{label}</Link>
        </li>
    );
};
```

**Sorting is unchanged in this version.** `useRenderedNavigationItems` sorts the array it receives and renders a section's `children` in declaration order, as it always has. Having Squide sort at every depth ships separately, so that a behavior change is not bundled with an additive one.

The documentation described `$priority` as scoped to top-level items and ignored elsewhere. That was accurate about the implementation and wrong about where the prop is heading, and has been corrected.
