---
order: 200
---

!!!tip
The documentation for Squide firefly v8 is available [here](https://squide-firefly-v8.netlify.app/getting-started/).
!!!

# Getting started

Welcome to Squide (yes :squid: with an **"e"**), a React modular application shell tailored for the needs of [Workleap](https://workleap.com/) web applications. In this getting started section, you'll find an overview of the shell and a [quick start](create-host.md) guide to create a new application from scratch.

## What is Squide?

Squide is a React modular application shell tailored for the needs of Workleap's web applications. It **enforces architectural patterns** that we deem important to write **scalable** and **maintainable** web **applications** at Workleap. 

By "modular application", we mean that much like in backend systems, a web application built with Squide should be **organized** as a **collection** of **independent modules**, each responsible for a specific part of the system (i.e., a bounded context or domain):

```powershell !#3,9-11
monorepo
├── apps
├────── host
├────── storybook
├── libs
├────── api
├────── shell
├── modules
├────── user-profile
├────── checkout
├────── inventory
```

In addition to modularity, Squide offers built-in mechanisms to handle most of the **cross-cutting functionalities** of a web application:

- Modular Routing
- Modular Navigation
- Authentication
- Global data fetching
- Public and Protected pages
- Localization
- Observability
- Errors handling
- Messaging
- Environment variables
- API requests mocking

Those cross-cutting functionalities uses most of the libraries recommended by Workleap's frontend technology stacks:

Feature | Library
---    | ---
Modular Routing | Squide extends [React Router](https://reactrouter.com/), adding modular routing capabilities.
Public and Protected pages | Squide bootstrapping flow facilitate the implementation of public & protected routes by providing a [Tanstack Query](https://tanstack.com/query/latest) wrapper, allowing applications to only load their protected data (session related data) if the requested route is protected. Additionally, Squide bootstrapping flow is smart enough to delay the rendering of the requested page until the initial data of an application is ready.
Localization | Squide includes built-in support for localization, powered by [i18next](https://www.i18next.com/). 
Observability | Squide includes built-in observability powered by [Honeycomb](https://www.honeycomb.io/).
API requests mocking | When in development, Squide bootstrapping flow ensure that the rendering of the requested page is delayed until all of the application [MSW](https://mswjs.io/) request handlers has been registered.
Development and production frontend infrastructure | Squide offers ready to use packages for [webpack](https://webpack.js.org/) and [Rsbuild](https://rsbuild.dev/).

## Why is Squide relevant?

**Short version:**

{.list-icon}
- :ok_hand: Encourage modularity
- :octagonal_sign: Stop reinventing the wheel
- :chart_with_downwards_trend: Lower product operating costs
- :chart_with_upwards_trend: Boost product development velocity
- :bullettrain_front: Accelerate time to market for initial product releases
- :sparkles: Enhance product quality and maintainability with a well designed API, tests suites and documentation

**Long version:**

Every Workleap's frontend applications must **implement**, to some extent, most of the **cross-cutting functionalities** listed in the [previous section](#what-is-squide) of this document. Implementing those cross-cutting functionalities require significant effort, typically involving senior or staff frontend developers and taking a **few months** of full-time **work** to **complete** (when done right). This process can slow down product teams, impact their velocity and **delay** the initial **release** of a new product.

Squide helps reduce both the initial development costs and the ongoing maintenance costs of frontend applications by offering a reusable, **well-tested**, and **thoroughly documented solution** developed by experienced frontend engineers. Squide streamlines the implementation of cross-cutting functionalities, allowing product teams to focus on delivering value without reinventing the wheel.

Having a well-tested and well-documented shell is a significant advantage, as application shell code is often poorly understood by product teams and typically lacks proper testing and documentation, which complicates the maintenance of a custom application shell.

By providing most of the required cross-cutting functionalities out of the box, Squide enables product teams to **reduce their operating costs** by minimizing the need for dedicated staff developers to build and maintain a custom application shell.

## Guiding principles

While developing the [API](/reference) of Squide, we kept a few guiding principles in mind. Those principles are not settled stones, you might want to diverge from them from time to time, but adhering to those will make your experience more enjoyable:

- A module should correspond to a **subdomain** of the application's business domain.
- A module should be **autonomous**.
- A module should **not directly reference** the **other modules** of the application. To coordinate with other modules, including the host application, a module should always use Squide's [Runtime API](../reference/runtime/runtime-class.md).
- A modular application should **feel cohesive**. Different parts of the application should have the ability to communicate with each others and react to changes happening outside of their boundaries (without taking an hard reference on other parts of the application).
- **Data** and **state** should **never** be **shared** between modules. Even if two modules require the same data or the same state values, they should load, store and manage those independently.

## Create your project

:point_right: To get started, follow the [quick start](create-host.md) guide to create a new Squide's application from scratch.

## Module Federation

Originally, Squide has been developed as a micro frontend application shell to ease the adoption of distributed applications at Workleap. While Squide remains a great shell for micro frontends applications, as our **product strategy shifted to Hero products** and most of Workleap's products moved away from distributed applications, we discovered that Squide also offers significant value for non-federated web applications. Therefore, we continue to invest into Squide and now describe it as a **shell for modular applications**, **supporting** both **remote modules** and **local modules** in **hybrid mode**.

The benefit of supporting both approaches in hybrid mode is that Workleap's products can initially be developed with local modules, which help separate concerns from the start, enabling teams to work independently and focus on specific areas of the application. As the product grows and encounters organizational scalability challenges, teams can seamlessly migrate local modules one by one into standalone remote modules powered by [Module Federation](https://module-federation.io/) without requiring updates to the application's core code.

:point_right: To get started with a micro frontrends application, follow the Module Federation [quick start](../module-federation/create-host.md) guide to create a new Squide's application from scratch.
