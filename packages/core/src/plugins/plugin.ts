import { Runtime } from "../runtime/runtime.ts";

export abstract class Plugin<TRuntime extends Runtime = Runtime> {
    protected readonly _name: string;
    protected readonly _runtime: TRuntime;

    constructor(name: string, runtime: TRuntime) {
        this._name = name;
        this._runtime = runtime;
    }

    get name() {
        return this._name;
    }
}
