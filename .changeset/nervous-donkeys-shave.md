---
"@squide/react-router": minor
"@squide/firefly": minor
---

Renamed the navigation item `$meta` option to `$context`, and the `meta` render prop to `context`.

`$meta` was added in `@squide/firefly` 18.2.0 / `@squide/react-router` 9.1.0 ([#665](https://github.com/workleap/wl-squide/pull/665)) as the channel for values the code rendering the menu should *read* rather than forward, as opposed to `$additionalProps`, which is spread onto the rendered component. Only the name changes, the behavior is identical:

```diff
runtime.registerNavigationItem({
    $id: "about",
    $label: "About",
-   $meta: {
+   $context: {
        highlight: true
    },
    to: "/about"
});
```

```diff
-const renderItem: RenderItemFunction = ({ label, linkProps, additionalProps, meta }, key) => {
+const renderItem: RenderItemFunction = ({ label, linkProps, additionalProps, context }, key) => {
    return (
-       <li key={key} style={{ fontWeight: meta.highlight ? "bold" : "normal" }}>
+       <li key={key} style={{ fontWeight: context.highlight ? "bold" : "normal" }}>
            <Link {...linkProps} {...additionalProps}>{label}</Link>
        </li>
    );
};
```

This should have been a major version, but `$meta` shipped on 2026-08-24 and no application has adopted it, so it goes out as a minor — the same call that was made in 6.3.0 for `$name` → `$id` ([#206](https://github.com/workleap/wl-squide/pull/206)).

**When migrating, check items that are not written as a fresh object literal.** A leftover `$meta` on a literal is a `TS2353` excess-property error and is caught at build time. On an item built through a variable or a helper — which is the usual shape for deferred registrations and conditional navigation — there is no error: the key is silently stripped and `context` is `{}`, so the item renders without its styling. Search for `$meta` rather than relying on the compiler.

`$context` is per-item data for the layout. It is unrelated to the module registration context passed to a module's `register` function, and unrelated to React context.
