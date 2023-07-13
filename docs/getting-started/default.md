---
order: 90
icon: rocket
expanded: true
---

# Getting started

Welcome to the `@squide` documentation. In this getting started section, you'll find an [overview](#overview) of the shell and a [quick start](create-host.md) guide to create a new federated application from scratch.

!!!warning The prefered way for creating a new federated application for the [Workleap](https://workleap.com/) platform is with our [foundry-cli](https://github.com/gsoft-inc/wl-foundry-cli).
+++ pnpm
```bash
pnpm create @workleap/project@latest <output-directory>
```
+++ yarn
```bash
yarn create @workleap/project@latest <output-directory>
```
+++ npm
```bash
npm create @workleap/project@latest <output-directory>
```
+++
!!!

## Overview

We have built this shell to facilitate the adoption of federated applications at [Workleap](https://workleap.com/) by **enforcing patterns** that we believe will help feature teams successfully implement a distributed architecture.

The shell itself is a lightweight [API layer](/references) built on top of [Webpack Module Federation](https://webpack.js.org/concepts/module-federation/) and [React Router](https://reactrouter.com), with the goal of maximizing the strength of both libraries while interfering as little as possible with their functionality.

### Webpack Module Federation

We have identified **2 major challenges** with frontend federated applications:
- How can we prevent loading the same large dependencies twice when switching between *modules*?
- How can we offer a cohesive experience that doesn't feel *modular*?

To address the first challenge, we believe that [Webpack Module Federation](https://webpack.js.org/concepts/module-federation/) provides a solution by offering a mecanism capable of **deduping common dependencies** shared **between** the **host** application and the **remote** modules at runtime.

With this mecanism in place, all federated parts of an application can now be loaded in the same [browsing context](https://developer.mozilla.org/en-US/docs/Glossary/Browsing_context) instead of nested browsing contexts such as [iframes](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe). 

By sharing the same browsing context (e.g. the same [Document](https://developer.mozilla.org/en-US/docs/Web/API/Document), the same [Window object](https://developer.mozilla.org/en-US/docs/Web/API/Window), and the same [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model)), federated parts now **form a unified and cohesive single application**, addressing the second challenge. 

With Webpack Module Federation, we believe that we can develop federated applications that provide the same user experience as monolithic applications :rocket:

### React Router

React Router [nested routes](https://reactrouter.com/en/main/start/tutorial#nested-routes) feature is ideal for federated applications as it enables highly **composable** and **decoupled** UI. Besides, what else would you use? :joy:

### Module registration

The most distinctive aspect of this shell is the conventions it enforces for loading and registering remote modules. Here's a brief overview of the flow:

1. During bootstrap, the host application attempts to [load predefined modules](/references/registration/registerRemoteModules.md) and calls a registration function with a specific name and signature for each successfully loaded module.

2. During registration, a module receives [the shared services](/references/runtime/runtime-class.md) of the federation application and use them to dynamically register its [routes](/references/runtime/runtime-class.md#register-routes) and [navigation items](/references/runtime/runtime-class.md#register-navigation-items).

3. Once [all the remote modules are registered](/references/registration/useAreRemotesReady.md), the host application will create a React Router [instance](https://reactrouter.com/en/main/routers/create-browser-router) with the registered routes and [renders a navigation menu](/references/routing/useRenderedNavigationItems.md) with the registered navigation items.

That's a nutshell overview. Of course, there is more to it, but these are the main ideas.

### Guiding principles

While developing the [API](/references) of `@squide`, we kept a few guiding principles in mind. Those principles are not settled stones, you might want to diverge from them from time to time, but adhering to those will make your experience more enjoyable:

- A module should always correspond to a subdomain of the application's business domain and should only export pages.

- A module should be fully autonomous. It shouldn't have to coordinate with other parts of the application for things as trivial as navigation links.

- A federated application should feel cohesive. Different parts of a federation application should have the ability to communicate with each others and react to changes happening outside of their boundaries.

- Data and state should never be shared between parts of a federated application. Even if two parts require the same data or the same state values, they should load, store and manage them independently.

### Limitations

[Webpack Module Federation](https://webpack.js.org/concepts/module-federation/) comes with a few manageable limitations that are important to consider when architecting your distributed application:

- A [shared dependency](https://webpack.js.org/plugins/module-federation-plugin/#sharing-hints) cannot be tree-shaken. Since remote modules are loaded at runtime, [ModuleFederationPlugin](https://webpack.js.org/plugins/module-federation-plugin) cannot infer which parts of a shared dependency will be used by the application modules. Therefore, tree-shaking is disabled for shared dependencies.

- Webpack Module Federation does not support React's [Fast Refresh](https://github.com/pmmmwh/react-refresh-webpack-plugin). However, it does support [Webpack Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/).

> These limitations are not specific to `@squide`, they are specific to Webpack Module Federation.


