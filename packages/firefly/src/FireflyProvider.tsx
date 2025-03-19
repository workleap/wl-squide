import { type Runtime, RuntimeContext } from "@squide/core";
import type { PropsWithChildren } from "react";

export interface FireflyProviderProps extends PropsWithChildren {
    runtime: Runtime;
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
