import { test, vi } from "vitest";
import { MswState } from "../src/MswState.ts";

test.concurrent("when the state is not set as ready, return false", ({ expect }) => {
    const state = new MswState();

    expect(state.isReady).toBeFalsy();
});

test.concurrent("when the state is set as ready, return true", ({ expect }) => {
    const state = new MswState();
    state.setAsReady();

    expect(state.isReady).toBeTruthy();
});

test.concurrent("can add listeners", ({ expect }) => {
    const state = new MswState();

    const listener1 = vi.fn();
    const listener2 = vi.fn();

    state.addMswReadyListener(listener1);
    state.addMswReadyListener(listener2);

    state.setAsReady();

    expect(listener1).toHaveBeenCalledOnce();
    expect(listener2).toHaveBeenCalledOnce();
});

test.concurrent("can remove listeners", ({ expect }) => {
    const state = new MswState();

    const listener1 = vi.fn();
    const listener2 = vi.fn();

    state.addMswReadyListener(listener1);
    state.addMswReadyListener(listener2);

    state.removeMswReadyListener(listener1);
    state.removeMswReadyListener(listener2);

    state.setAsReady();

    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).not.toHaveBeenCalled();
});
