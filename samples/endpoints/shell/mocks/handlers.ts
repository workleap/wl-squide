import { EnvironmentVariables } from "@squide/firefly";
import type { HttpHandler } from "msw";
import { getAuthenticationHandlers } from "./authenticationHandlers.ts";
import { getFeatureFlagsHandlers } from "./featureFlagsHandlers.ts";
import { getSessionHandlers } from "./sessionHandlers.ts";
import { getSubscriptionHandlers } from "./subscriptionHandlers.ts";

// Must specify the return type, otherwise we get a TS2742: The inferred type cannot be named without a reference to X. This is likely not portable.
// A type annotation is necessary.
export function getRequestHandlers(environmentVariables: EnvironmentVariables): HttpHandler[] {
    return [
        ...getAuthenticationHandlers(environmentVariables),
        ...getSessionHandlers(environmentVariables),
        ...getFeatureFlagsHandlers(environmentVariables),
        ...getSubscriptionHandlers(environmentVariables)
    ];
}
