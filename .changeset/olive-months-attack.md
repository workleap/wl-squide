---
"@squide/react-router": minor
"@squide/firefly": minor
---

Navigation item registration validation messages now report the actual menu id and section id of a pending registration. They were previously parsed back out of an internal index key by splitting on `-`, which produced incorrect names whenever a `menuId` or a section `$id` contained a dash.

- `PendingRegistrationItem` is now exported. `PendingNavigationItemRegistrations` was typed as holding `RegistryItem` values while it actually holds `PendingRegistrationItem` values, which carry the `menuId` and `sectionId` a registration is waiting for.
- `parseSectionIndexKey` is deprecated. Nothing in the framework calls it anymore and no public API hands out the index keys it parses. It is kept until the next major to avoid a breaking removal.
