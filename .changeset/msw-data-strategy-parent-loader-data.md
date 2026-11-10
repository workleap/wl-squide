---
"@squide/firefly": patch
---

When MSW is enabled, navigating between sibling routes no longer erases the loader data of their parent route. The data strategy that waits for MSW now only resolves the routes that React Router asks to load.
