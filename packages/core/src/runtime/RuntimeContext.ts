import { createContext, useContext } from "react";
import { isNil } from "../shared/assertions.ts";
import type { Runtime } from "./Runtime.ts";

export const RuntimeContext = createContext<Runtime | undefined>(undefined);

export function useRuntime() {
    const runtime = useContext(RuntimeContext);

    if (isNil(runtime)) {
        throw new Error("[squide] The useRuntime function is called before a Runtime instance has been provided.");
    }

    return runtime;
}
