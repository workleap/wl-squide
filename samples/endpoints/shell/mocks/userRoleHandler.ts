import { EnvironmentVariables } from "@squide/firefly";
import { http, HttpHandler, HttpResponse } from "msw";
import { simulateDelay } from "./simulateDelay.ts";
import { userRoleManager } from "./userRole.ts";

// Must specify the return type, otherwise we get a TS2742: The inferred type cannot be named without a reference to X. This is likely not portable.
// A type annotation is necessary.
export function getUserRoleHandlers(environmentVariables: EnvironmentVariables): HttpHandler[] {
    return [
        http.get(`${environmentVariables.userRoleApiBaseUrl}getRole`, async () => {
            const role = userRoleManager.getRole();

            await simulateDelay(500);

            return HttpResponse.json(role);
        }),

        http.post(`${environmentVariables.userRoleApiBaseUrl}switch`, () => {
            const role = userRoleManager.getRole();

            userRoleManager.setRole(role === "user" ? "admin" : "user");

            console.log("[endpoints] New user role is:", role);

            return new HttpResponse(null, {
                status: 200
            });
        })
    ];
}
