import "@squide/firefly";

declare module "@squide/firefly" {
    interface EventMap {
        "write-to-host": string;
        "show-toast": string;
    }
}
