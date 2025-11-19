import type { FederationRuntimePlugin } from "@module-federation/enhanced/runtime";

const plugin: () => FederationRuntimePlugin = () => {
    return {
        name: "non-cacheable-remote-entry-plugin",
        createScript: function({ url }) {
            const element = document.createElement("script");

            // Adding a timestamp to make sure the remote entry points are never cached.
            // View: https://github.com/module-federation/module-federation-examples/issues/566.
            element.src = `${url}?t=${Date.now()}`;
            element.type = "text/javascript";
            element.async = true;

            return element;
        }
    };
};

export default plugin;
