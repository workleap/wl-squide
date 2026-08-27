---
"@squide/react-router": patch
"@squide/firefly": patch
---

Fixed a navigation section index collision that could put a nested item in the wrong menu.

The section index is keyed by a `menuId` and a section `$id` joined into one string. Both halves are consumer-provided, and the separator was `-`, which either half can contain. So `("analytics", "sidebar-performance")` and `("analytics-sidebar", "performance")` both produced `analytics-sidebar-performance` and shared one index entry.

Three things followed from that:

- An item registered with a `sectionId` could be nested under the colliding section, in a different menu.
- Registering the second of two colliding sections threw `A navigation section index has already been registered for the menu`, even though the two are distinct.
- Strict mode could report one missing section when two were missing, since both waited on the same key.

The separator is now the NUL character (`\u0000`), which cannot appear in a `menuId` or a section `$id` anyone would write.

**The keys returned by `getPendingSectionIds` change format.** They have always been documented as an implementation detail — `parseSectionIndexKey` is deprecated for exactly this reason — and nothing in the framework parses them. If you do, read the `menuId` and `sectionId` off the items returned by `getPendingRegistrationsForSection` instead, where they are separate fields. `parseSectionIndexKey` now splits on the new separator, and as a result returns the correct pair for ids that contain a `-`, which it could not do before.
