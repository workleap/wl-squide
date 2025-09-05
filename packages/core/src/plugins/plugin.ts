import type { Runtime } from "../runtime/runtime.ts";

export abstract class Plugin {
    protected readonly _name: string;
    protected readonly _runtime: Runtime;

    constructor(name: string, runtime: Runtime) {
        this._name = name;
        this._runtime = runtime;
    }

    get name() {
        return this._name;
    }
}
