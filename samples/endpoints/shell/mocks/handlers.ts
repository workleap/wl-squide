import { EnvironmentVariables } from "@squide/firefly";
import type { HttpHandler } from "msw";
import { getAuthenticationHandlers } from "./authenticationHandlers.ts";
import { getSessionHandlers } from "./sessionHandlers.ts";
import { getSubscriptionHandlers } from "./subscriptionHandlers.ts";
import { getUserRoleHandlers } from "./userRoleHandler.ts";

// Must specify the return type, otherwise we get a TS2742: The inferred type cannot be named without a reference to X. This is likely not portable.
// A type annotation is necessary.
export function getRequestHandlers(environmentVariables: EnvironmentVariables): HttpHandler[] {
    return [
        ...getAuthenticationHandlers(environmentVariables),
        ...getSessionHandlers(environmentVariables),
        ...getUserRoleHandlers(environmentVariables),
        ...getSubscriptionHandlers(environmentVariables)
    ];
}
