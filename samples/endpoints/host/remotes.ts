import type { RemoteDefinition } from "@squide/firefly-rsbuild-configs";

export const Remote1Definition: RemoteDefinition = {
    name: "remote1",
    url: process.env.NETLIFY === "true" ? "https://squide-endpoints-remote-module.netlify.app" : "http://localhost:8081"
};

export const AllRemotes: RemoteDefinition[] = [
    Remote1Definition
];
