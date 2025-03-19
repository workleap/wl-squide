import { RuntimeContext } from "@squide/core";
import type { PropsWithChildren } from "react";
import type { FireflyRuntime } from "./FireflyRuntime.tsx";

export interface FireflyProviderProps extends PropsWithChildren {
    runtime: FireflyRuntime;
}

export function FireflyProvider(props: FireflyProviderProps) {
    const {
        runtime,
        children
    } = props;

    return (
        <RuntimeContext.Provider value={runtime}>
            {children}
        </RuntimeContext.Provider>
    );
}
