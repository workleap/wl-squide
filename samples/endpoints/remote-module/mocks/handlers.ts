import { EnvironmentVariables } from "@squide/firefly";
import type { HttpHandler } from "msw";
import { getFeatureHandlers } from "./featureHandlers.ts";
import { getRickAndMortyHandlers } from "./rickAndMortyHandlers.ts";

// Must specify the return type, otherwise we get a TS2742: The inferred type cannot be named without a reference to X. This is likely not portable.
// A type annotation is necessary.
export function getRequestHandlers(environmentVariables: EnvironmentVariables): HttpHandler[] {
    return [...getRickAndMortyHandlers(environmentVariables), ...getFeatureHandlers(environmentVariables)];
}

