---
order: 960
visibility: hidden
---

# Manage shared state

Proper management of shared state is crucial in a modular application and can become problematic if not handled carefully. As a general rule, a host application and its modules should never share state.

## Forward the global data

However, in the lifecycle of a modular application, the host will fetch the global data that should be fordwarded to the modules. Such examples include a user session or a user tenant subscription status.

As shown in the [Fetch global data](./fetch-global-data.md#fetch-the-data-1) guide, the global data can be forwarded to modules through a React context.

## TanStack Query

Lastly, as detailed in the [fetch page data](./fetch-page-data.md#setup-the-query-client) guide, the TanStack Query cache should not be shared between the host and its modules. To do so, both the host application and the modules should instantiate their own `QueryClient` instance.
