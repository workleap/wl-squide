---
"@squide/firefly": patch
---

`initializeFirefly` and `bootstrap` now throw immediately when MSW is enabled and no `startMsw` function is provided, instead of failing later as an unhandled promise rejection. When the modules registration or the deferred registrations fail unexpectedly, the error is now logged, and the modules registration error is also passed to the `onError` handler.
