import type { RequestHandler } from "msw";
import { setupWorker } from "msw/browser";

export function startMsw(requestHandlers: RequestHandler[]) {
    const worker = setupWorker(...requestHandlers);

    return worker.start({
        onUnhandledFrame: "bypass"
    });
}
