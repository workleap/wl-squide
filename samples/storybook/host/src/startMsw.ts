import { RequestHandler } from "msw";
import { setupWorker } from "msw/browser";

export async function startMsw(moduleRequestHandlers: RequestHandler[]) {
    const worker = setupWorker(...moduleRequestHandlers);

    await worker.start({
        onUnhandledRequest: "bypass"
    });
}
