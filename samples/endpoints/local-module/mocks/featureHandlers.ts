import { EnvironmentVariables } from "@squide/firefly";
import { HttpResponse, http, type HttpHandler } from "msw";
import { featureFlagsAccessor } from "./featureFlags.ts";
import { sessionAccessor } from "./session.ts";

// Must specify the return type, otherwise we get a TS2742: The inferred type cannot be named without a reference to X. This is likely not portable.
// A type annotation is necessary.
export function getFeatureHandlers(environmentVariables: EnvironmentVariables): HttpHandler[] {
    return [
        http.get(`${environmentVariables.featureApiBaseUrl}getFeatureA`, () => {
            const session = sessionAccessor.getSession();

            if (!session) {
                return new HttpResponse(null, {
                    status: 401
                });
            }

            const featureFlags = featureFlagsAccessor.getFeatureFlags();

            if (!featureFlags.featureA) {
                return new HttpResponse(null, {
                    status: 403
                });
            }

            const isEn = session.preferredLanguage === "en-US";

            if (isEn) {
                return HttpResponse.json({
                    message: "This page is only available if the <code>featureA</code> flag is active."
                });
            } else {
                return HttpResponse.json({
                    message: "Cette page est uniquement disponible si la fonctionnalité <code>featureA</code> est activé."
                });
            }
        })
    ];
}
