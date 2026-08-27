---
"@squide/react-router": minor
"@squide/firefly": minor
---

Fixed a navigation section index collision that could put a nested item in the wrong menu.

The section index is keyed by a `menuId` and a section `$id` joined into one string. Both halves are consumer-provided, and they were joined with a `-`, which either half can contain. So `("analytics", "sidebar-performance")` and `("analytics-sidebar", "performance")` both produced `analytics-sidebar-performance` and shared one index entry.

Three things followed from that:

- An item registered with a `sectionId` could be nested under the colliding section, in a different menu.
- Registering the second of two colliding sections threw `A navigation section index has already been registered for the menu`, even though the two are distinct.
- Strict mode could report one missing section when two were missing, since both waited on the same key.

The menu id is now length-prefixed rather than merely separated from the section id, so the split is unambiguous whatever the ids hold. Picking a separator that ids are unlikely to contain would only move the collision instead of removing it, since nothing constrains an id to exclude it.

**The keys returned by `getPendingSectionIds` change format.** They have always been documented as an implementation detail, and `parseSectionIndexKey` is deprecated for exactly that reason. Nothing in the framework parses them. If you do, read the `menuId` and the `sectionId` off the items returned by `getPendingRegistrationsForSection` instead, where they are separate fields.

`parseSectionIndexKey` follows the new format and now recovers the pair correctly for any ids, including ones containing a `-` or the separator itself, which it could not do before. It stays deprecated. Given a key in the old format, or any other string that does not hold the separator it uses, it returns an empty `menuId` and the whole input as the `sectionId` rather than a pair. Keys are produced by `getPendingSectionIds` and consumed within the same bootstrap, so a key outliving the version that made it is not a case that arises.

Released as a minor rather than a patch. The identical fix shipped as a minor in `@squide/react-router@9.3.0` before being withdrawn by the `9.4.0` revert, and the `getPendingSectionIds` format change should not reach a consumer pinned to `~9.4.0` silently.
