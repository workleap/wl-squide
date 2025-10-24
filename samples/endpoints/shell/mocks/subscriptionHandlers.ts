import type { EnvironmentVariables } from "@squide/env-vars";
import { HttpResponse, http, type HttpHandler } from "msw";
import { sessionManager } from "./session.ts";

// Must specify the return type, otherwise we get a TS2742: The inferred type cannot be named without a reference to X. This is likely not portable.
// A type annotation is necessary.
export function getSubscriptionHandlers(environmentVariables: EnvironmentVariables): HttpHandler[] {
    return [
        http.get(`${environmentVariables.subscriptionApiBaseUrl}getSubscription`, () => {
            if (!sessionManager.getSession()) {
                return new HttpResponse(null, {
                    status: 401
                });
            }

            return HttpResponse.json({
                company: "Workleap",
                contact: "John Doe",
                status: "paid"
            });
        }),
        http.get(`${environmentVariables.subscriptionApiBaseUrl}failing`, () => {
            throw new Error("This is an HTTP error!");
        })
    ];
}
