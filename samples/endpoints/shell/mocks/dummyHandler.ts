import type { EnvironmentVariables } from "@squide/firefly";
import { http, type HttpHandler, HttpResponse } from "msw";

export function getDummyHandler(environmentVariables: EnvironmentVariables): HttpHandler {
    return http.get(environmentVariables.dummyHandlerUrl, () => {
        return HttpResponse.json({ name: "John Smith" });
    });
}
