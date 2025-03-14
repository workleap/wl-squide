# @templates/getting-started

> [!IMPORTANT]  
> This template is structured as a monorepo, which makes it easy for demonstrating Squide. However, if you are building a federated application that composes remote modules at runtime, the "host" application and the "remote module" should be in distinct repositories.

## Install the template

To install the template, first clone the template with [degit](https://github.com/Rich-Harris/degit) by opening a terminal at the location you want to create your project:

```bash
pnpm dlx degit https://github.com/workleap/wl-squide/templates/getting-started
```

Then open the newly created folder, open a terminal at the root of the workspace and execute the following command:

```bash
pnpm install
```

Finally, update the dependencies by execute the following command:

```bash
pnpm update-outdated-deps
```

## Use the template

To start the development server, open a terminal at the root of the workspace and execute the following command:

```bash
pnpm dev
```

To build the apps for release, execute the following command:

```bash
pnpm build
```
