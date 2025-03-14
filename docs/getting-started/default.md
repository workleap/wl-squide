---
order: 90
icon: rocket
expanded: true
---

!!!contrast
The documentation for Squide firefly v8 is available [here](https://squide-firefly-v8.netlify.app/getting-started/).
!!!

# Getting started

Welcome to Squide (yes :squid: with an **"e"**), a shell for [Workleap](https://workleap.com/) web applications built on top of [Module Federation](https://module-federation.io/), [React Router](https://reactrouter.com) and [TanStack Query](https://tanstack.com/query/latest). In this getting started section, you'll find an overview of the shell and a [quick start](create-host.md) guide to create a new application from scratch.

<!-- !!!warning Foundry CLI

The prefered way for creating a new modular application for the Workleap's platform is with the [foundry-cli](https://github.com/workleap/wl-foundry-cli).
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
!!! -->

## Why Squide?

We originally built this shell to facilitate the adoption of federated applications at Workleap by **enforcing patterns** that we believe are essential for teams to successfully implement a distributed frontend architecture.

While Squide remains a great shell for federated applications, as we experimented with new products, we discovered that Squide also **offers** significant **value** for **non-federated** web applications:

- With the power of [local modules](../reference/registration/registerLocalModules.md) and the [Runtime API](../reference/runtime/runtime-class.md), Squide addresses a long-lasting challenge at Workleap: _How can we effectively enforce the boundaries of a business subdomain in the frontend?_ Squide's modular design naturally upholds these boundaries.

- With Squide, teams can confidently develop new products as a simple **monorepo** application, knowing that as new members are onboarded, their development **velocity** will **scale** seamlessly. Over time, local modules can be migrated to [remote modules](../reference/registration/registerRemoteModules.md) without the need to refactor the core application architecture.

For both federated and non-federated web applications, Squide's **modular architecture** and lightweight [API layer](/reference) provide a significant upside, combining the strengths of industry-leading third-party libraries:

### Module Federation

We identified **2 major challenges** with federated applications:
- How can we prevent loading the same large dependencies twice when switching between *modules*?
- How can we offer a cohesive experience that doesn't feel *modular*?

To address the first challenge, we believe that Module Federation provides a solution by offering a mechanism capable of **deduping common dependencies** shared **between** the **host** application and the **remote** modules at runtime.

With this mechanism in place, all federated parts of an application can now be loaded in the same [browsing context](https://developer.mozilla.org/en-US/docs/Glossary/Browsing_context) instead of nested browsing contexts such as [iframes](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe). 

By sharing the same browsing context (e.g. the same [Document object](https://developer.mozilla.org/en-US/docs/Web/API/Document), the same [Window object](https://developer.mozilla.org/en-US/docs/Web/API/Window), and the same DOM), federated parts now **form a unified and cohesive single application**, addressing the second challenge. 

With Module Federation, we hope to develop federated applications that provide the same user experience as monolithic applications :rocket:.

### React Router

React Router [nested routes](https://reactrouter.com/en/main/start/tutorial#nested-routes) feature is ideal for modular applications as it enables highly **composable** and **decoupled** UI. For a more in-depth explanation, refer to this [article](https://www.infoxicator.com/why-react-router-is-excellent-for-micro-frontends).

### TanStack Query

TanStack Query simplifies server state management with an innovative approach to data fetching, caching, and synchronization, enhancing both the perceived performance and the user experience.

TanStack Query is particularly well-suited for modular applications due to its ability to **manage** server **state across** multiple **independent** React **components**. It’s an effective solution for modular applications that requires **isolating data** and **state** between independent parts.

## Module registration

The most distinctive aspect of this shell is the conventions it enforces for loading and registering remote modules. Here's a brief overview of the flow:

1. During bootstrap, the host application attempts to [load predefined modules](/reference/registration/registerLocalModules.md) and calls a registration function with a specific name and signature for each successfully loaded module.

2. During registration, a module receives the [runtime](/reference/runtime/runtime-class.md) of the application and use the instance to dynamically register its [routes](/reference/runtime/runtime-class.md#register-routes) and [navigation items](/reference/runtime/runtime-class.md#register-navigation-items).

3. Once all the modules are registered, the host application will create a React Router [instance](https://reactrouter.com/en/main/routers/create-browser-router) with the registered routes and [renders a navigation menu](/reference/routing/useRenderedNavigationItems.md) with the registered navigation items.

This is a high-level overview. Of course, there is more to it, but these are the main ideas.

## Guiding principles

While developing the [API](/reference) of Squide, we kept a few guiding principles in mind. Those principles are not settled stones, you might want to diverge from them from time to time, but adhering to those will make your experience more enjoyable:

- A module should correspond to a subdomain of the application's business domain.

- A module should be autonomous.

- A module should not directly reference the other modules of the application. To coordinate with other modules, including the host application, a module should always use Squide's [Runtime API](../reference/runtime/runtime-class.md).

- A modular application should feel cohesive. Different parts of the application should have the ability to communicate with each others and react to changes happening outside of their boundaries (without taking an hard reference on other parts of the application).

- Data and state should never be shared between modules. Even if two modules require the same data or the same state values, they should load, store and manage those independently.

## Limitations

If you choose to include remote modules to your application, Module Federation comes with a few manageable limitations that are important to consider when architecting a distributed application:

- A [shared dependency](https://module-federation.io/configure/shared.html) cannot be tree-shaken. Since remote modules are loaded at runtime, module federation cannot infer which parts of a shared dependency will be used by the application modules. Therefore, tree-shaking is disabled for shared dependencies.

- Updating a [shared dependency](https://module-federation.io/configure/shared.html) to a new major version is not always straightforward and may result in complex deployment processes.

## Create your project

To get started, follow the [quick start](create-host.md) guide to create a new Squide's application from scratch.
