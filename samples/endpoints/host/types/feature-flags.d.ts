import "@squide/firefly";

declare module "@squide/firefly" {
    interface FeatureFlags {
        "enable-log-rocket": boolean;
        "enable-honeycomb": boolean;
        "register-local-module": boolean;
        "register-remote-module": boolean;
        "show-characters": boolean;
    }
}
