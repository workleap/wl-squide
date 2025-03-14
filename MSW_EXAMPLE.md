# MSW example

This repository include samples using a Module Federation setup. Those samples could be of help to the MSW maintainers to troubleshoot issues that are specific to federated applications.

Note for Squide maintainers: This file is referenced in the MSW example repository [here](https://github.com/mswjs/examples/issues/123).

## Installation

To install the sample and start the application with a developer server, follow these steps.

- Clone the repository locally: `git clone https://github.com/workleap/wl-squide.git`.

- Install the codebase with PNPM, execute the following command at the root of the monorepo: `pnpm install`.

- Start the sample application by executing the following command at the root of the monorepo: `pnpm dev-endpoints`.

- Once the sample application is started, open a browser and navigate to `http://localhost:8080`.

- The application should render a login page. Use `temp` as the username and `temp` as the password.


## Sample application topology

- The sample application code is located [here](https://github.com/workleap/wl-squide/tree/troubleshoot-msw-2.6.0/samples/endpoints)

- The sample application includes three applications: 
    - [host](https://github.com/workleap/wl-squide/tree/troubleshoot-msw-2.6.0/samples/endpoints/host)
    - [remote-module](https://github.com/workleap/wl-squide/tree/troubleshoot-msw-2.6.0/samples/endpoints/remote-module)-
    - [local-module](https://github.com/workleap/wl-squide/tree/troubleshoot-msw-2.6.0/samples/endpoints/local-module). 

### `host`

This is the [HOST application](https://github.com/workleap/wl-squide/tree/main/samples/endpoints/host) that instanciate a registry (through a `FireflyRuntime` class), provides the registry to the modules and then start the MSW service. The parts that should be of interest are:

- [The registration block](https://github.com/workleap/wl-squide/blob/main/samples/endpoints/host/src/bootstrap.tsx#L23)
- [browser.ts](https://github.com/workleap/wl-squide/blob/main/samples/endpoints/host/mocks/browser.ts)
- [The bootstrap function](https://github.com/workleap/wl-squide/blob/main/packages/firefly/src/boostrap.ts)

### `remote-module`

This is the [REMOTE app](https://github.com/workleap/wl-squide/tree/main/samples/endpoints/remote-module) using [Module Federation](https://module-federation.io/). It registers it's request handlers in the [src/register.tsx](https://github.com/workleap/wl-squide/blob/main/samples/endpoints/remote-module/src/register.tsx#L138) file.

### `local-module`

This is more like a [LIBRARY project](https://github.com/workleap/wl-squide/tree/main/samples/endpoints/local-module) that register pages and request handlers than an actual app. It's loaded at build time rather than at RUNTIME like a REMOTE app. I don't think this project is of interest to you.
