---
order: 400
label: Use environment variables
---

# Use environment variables

Environment variables are incredibly useful when working with **multiple environments**, such as `dev`, `staging`, and `production` because they **decouple configuration** from **code**. This allows to change an application's behavior without modifying the code itself. A common example is the URLs of dedicated API services, where each environment uses a different URL.

By attaching environment variables to a [FireflyRuntime](../reference/runtime/FireflyRuntime.md) instance, rather than accessing `process.env` throughout the codebase, Squide provides a more modular, robust, and centralized way to manage environment variables.

==- Why is using `process.env` problematic?
While accessing environment variables through `process.env` works, it comes with several drawbacks:

- **Not ideal for testing**: Mocking `process.env` is cumbersome because it is a global variable. This often results in flaky tests, poor isolation, and unexpected side effects.
- **Not ideal for modular code**: Modules that rely on global variables are harder to load independently, reuse, or run in different host applications. This goes against modular design principles.
- **Couples the code to Node.js**: Many environments do not support `process.env`, including browsers, Web Workers, Service Workers, Cloudflare Workers, Vercel Edge Functions, Netlify Edge Functions, and Deno (unless running in Node-compatibility mode).
===

For more details, refer to the [reference](../reference/env-vars/EnvironmentVariablesPlugin.md) documentation.

## Retrieve the plugin instance

## Register a variable

## Register multiple variables at once


-> Can also register multiple environment variables at once during the plugin instanciation (maybe add this in a collapse?)

## Retrieve a single variable

## Retrieve all the variables

## Setup the plugin

Refer to the [Setup environment variables](../integrations/setup-env-vars.md) integration guide.
