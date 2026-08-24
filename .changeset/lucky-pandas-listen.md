---
"@squide/react-router": minor
"@squide/firefly": minor
---

Added a `$meta` option to navigation items, separating metadata the rendering code reads from props it forwards.

`$additionalProps` is spread onto the component that the layout renders, therefore every key must be a valid prop for that component. `$meta` is handed to the rendering code as `meta` and is never spread:

```tsx
runtime.registerNavigationItem({
    $id: "about",
    $label: "About",
    $meta: {
        highlight: true
    },
    to: "/about"
});
```

```tsx
const renderItem: RenderItemFunction = (item, key) => {
    if (!isNavigationLink(item)) {
        return null;
    }

    const { label, linkProps, additionalProps, meta } = item;

    return (
        <li key={key} style={{ fontWeight: meta.highlight ? "bold" : "normal" }}>
            <Link {...linkProps} {...additionalProps}>{label}</Link>
        </li>
    );
};
```

Previously, a value that the renderer had to read rather than forward had nowhere to go but `$additionalProps`, leaving each renderer to remember to destructure it out before spreading. A renderer that spread the whole bag emitted the value as an invalid DOM attribute, which React only warns about in development. `meta` defaults to an empty object, so it can be destructured without a guard.

This is purely additive. Existing items keep working unchanged, and `$additionalProps` behaviour is untouched.

`useRenderedNavigationItems` now also strips every `$` prefixed property generically before building `linkProps`, instead of omitting a fixed list of known properties. Adding a new framework property no longer risks leaking it onto the rendered element, and a `$priority` on a nested item is no longer forwarded.
