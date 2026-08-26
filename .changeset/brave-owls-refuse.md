---
"@squide/react-router": minor
"@squide/firefly": minor
---

`registerNavigationItem` now refuses a `$priority` when a `sectionId` is provided.

`$priority` only ever ordered a menu's **top-level** items. `useRenderedNavigationItems` sorts the array it receives and then recurses into a section's `children` untouched, so a priority on a nested item never affected the rendered order.

Passing both together nonetheless type checked with no casts, and the priority was silently dropped — in the cross-module case where ordering actually matters most. That combination is now a compile-time error:

```ts
// Was accepted, did nothing. Now a TypeScript error.
runtime.registerNavigationItem({
    $id: "page",
    $label: "Page",
    $priority: 10,
    to: "/page"
}, {
    sectionId: "settings"
});
```

`registerNavigationItem` is split into two overloads. The `sectionId` one takes a `NestedNavigationItem`, whose `$priority` is typed `never`, so both an object literal and a variable typed `RootNavigationItem` are rejected. Writing `$priority` directly inside a `children` literal was already an excess-property error and still is.

**There is no runtime change.** Nothing about how items register or render is different, and no menu will reorder. The only thing that changes is that code which was quietly doing nothing now fails to build.

This is released as a **minor** rather than a patch because a consumer whose code passes both today will see a new compile error. The fix is to remove the `$priority` — it was having no effect. There is no supported way to order items *inside* a section by priority; ordering there follows the section's `children` array, which for `sectionId` registrations is the order those registrations run in.

## New type

- **`NestedNavigationItem`** — a `NavigationItem` with `$priority` typed `never`. Exported for consumers writing their own wrappers around `registerNavigationItem`.
- **`RegisterRootNavigationItemOptions`** and **`RegisterNestedNavigationItemOptions`** — the two option shapes the overloads take.

## Also

The documentation and the `workleap-squide` skill previously said the `sectionId` path compiles and drops the priority silently. That was accurate when written and is no longer true, so both were corrected in the same change.
