---
order: 11
---

# Learn the key principles

While developing the [API](/reference) of Squide, we kept a few key principles in mind. Those principles are not settled stones, you might want to diverge from them from time to time, but adhering to those will make your experience more enjoyable:

- A module should correspond to a **domain** or **subdomain** of the application.
- A module should be **autonomous**.
- A module should **not directly reference** the **other modules** of the application. To coordinate with other modules, including the host application, a module should always use Squide's [Runtime API](../reference/runtime/FireflyRuntime.md).
- A modular application should **feel cohesive**. Different parts of the application should have the ability to communicate with each others and react to changes happening outside of their boundaries (without taking an hard reference on other parts of the application).
- **Data** and **state** should **never** be **shared** between modules. Even if two modules require the same data or the same state values, they should load, store and manage those independently.
