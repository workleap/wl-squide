---
"@squide/firefly-module-federation": patch
"@squide/firefly": patch
---

useDeferredRegistrations will now trigger a deferred registration update whenever the data object reference changes, even if no global data has been fetch or no feature flags changed.
