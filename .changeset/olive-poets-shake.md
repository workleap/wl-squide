---
"@squide/react-router": patch
"@squide/firefly": patch
---

Fixed navigation item corruption on the deferred registrations update path.

- A deferred nested navigation item registered while its section was missing stayed in the pending registrations index forever, and was replayed **in addition to** the item registered by the current run once the section came back. A navigation section gated by a feature flag therefore accumulated a duplicate of every nested item each time the flag was toggled off and on again. The same happened when a module's deferred registration function threw and then recovered on a later run.
- Clearing the deferred navigation items deleted the section index entries of **every** menu rather than only those of the deferred items being cleared. A menu registering a static section with the same `$id` as another menu's deferred section lost its section index entry on the first update run, after which nested items registered under it silently went pending and the duplicated `$id` guard stopped throwing.
- A deferred navigation section index entry orphaned by a failed registration is now cleared as well, instead of poisoning that menu and `$id` pair for the lifetime of the runtime.

You were affected if your application registers nested navigation items under a navigation section that is registered by a deferred registration function, especially one gated by a feature flag.
