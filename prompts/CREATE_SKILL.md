Using the "skill-creator" skill, create an agent skill for the Squide library, based on the official documentation. The purpose of this skill is to help developers understand and use Squide’s APIs and patterns to build modular frontend applications in a consistent and correct way.

The skill should enable an agent to:

* Explain Squide’s main concepts and how they fit together, including application setup, runtime configuration, routing, navigation, and shared services.
* Describe how to register routes, navigation items, request handlers, and other application features using Squide’s runtime APIs.
* Provide examples of common usage patterns such as public and protected routes, global data fetching, event-based communication, feature flags, logging, and environment configuration.
* Answer developer questions using only documented Squide APIs and recommended patterns.

The skill must:

* Not invent APIs, configuration options, or behaviors that are not documented.
* Not suggest undocumented or deprecated usage patterns.
* Ignore everything related to micro-frontends, module federation or bundlers (including Webpack and rsbuild).
* Not have a description exceeding a maximum length of 1024 characters.

The agent should assume:

* A modern React and TypeScript codebase.
* Squide is used as an application framework and runtime for structuring frontend features.

The generated skill should:

* Provide clear, concise explanations and examples.
* Be reliable for pull request reviews, developer support, and learning use cases.
* Minimize token usage by focusing only on relevant Squide concepts and APIs.

Relevant questions the skill should be able to answer:

* What is Squide and what problems does it solve in frontend applications?
* How do you create a new Squide application from scratch?
* How do I structure an application using Squide?
* What does modular architecture mean in the context of a Squide application?
* How do you register local modules in a Squide application?
* What is the Firefly runtime and what role does it play in a Squide app?
* How do you register routes in a Squide module?
* How do you register navigation items for your modular application?
* What are deferred navigation items and when should you use them?
* How do you register MSW request handlers in a module?
* What is the difference between public and protected pages in Squide?
* How does Squide help with global protected data fetching?
* What hooks or helpers does Squide provide for public global data fetching?
* How do you use the event bus to communicate between modules?
* How can you integrate logging into a Squide application?
* What is the approach to environment variables in a Squide app?
* How do you integrate and use feature flags (e.g., with LaunchDarkly) in Squide?
* What is the recommended way to orchestrate page data fetching and rendering flow?
* How do you set custom Honeycomb attributes for observability in Squide?
* How do plugins work in Squide and when should you use them?
* What are common pitfalls when registering modules, routes, or navigation items in Squide?

The documentation is located in the "docs" folder. Only use the documentation of the following folders:

* ./docs/introduction
* ./docs/integrations
* ./docs/essentials
* ./docs/reference

And ignore the documentation of the following folders:

* ./docs/reference/fakes
* ./docs/reference/module-federation
* ./docs/rsbuild
* ./docs/webpack

For the logger API, refer to the `wl-logging` package documentation available here: https://workleap.github.io/wl-logging.

The skill should at least trigger when the agent encounters questions about:

* Creating/modifying Squide host applications or modules
* Registering routes, navigation items, or MSW handlers
* Working with FireflyRuntime, initializeFirefly, or AppRouter
* Setting up integrations (TanStack Query, i18next, LaunchDarkly, Honeycomb, MSW, Storybook)
* Implementing deferred registrations or conditional navigation items
* Fetching global data with usePublicDataQueries/useProtectedDataQueries
* Using Squide hooks (useNavigationItems, useRenderedNavigationItems, useIsBootstrapping, etc.)
* Implementing error boundaries in modular applications
* Questions about modular architecture patterns in React
