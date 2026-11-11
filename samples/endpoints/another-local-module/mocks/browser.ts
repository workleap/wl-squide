import type { RequestHandler } from "msw";
import { setupWorker } from "msw/browser";

export async function startMsw(requestHandlers: RequestHandler[]) {
    const worker = setupWorker(...requestHandlers);

    await worker.start({
        onUnhandledFrame: "bypass"
    });
}
