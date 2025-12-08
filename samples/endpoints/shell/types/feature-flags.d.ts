import "@squide/firefly";

declare module "@squide/firefly" {
    interface FeatureFlags {
        "show-update-session-button": boolean;
        "show-switch-user-role-button": boolean;

    }
}
