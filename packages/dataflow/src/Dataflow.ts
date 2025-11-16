import {simpleHash} from "./simpleHash.ts";
import {LazyProperties} from "./LazyProperties.ts";
import {getInputs, getOutputs, parseFunction} from "./function-parsing.ts";
import {isAsyncIterable} from "./IsAsyncIterable.ts";

export class Dataflow {
    define(fun: Function): any {
        const id = simpleHash(fun.toString());
        const definition = parseFunction(fun);
        const inputs = getInputs(definition);
        const outputs = getOutputs(definition);
        this.set(id, inputs, fun)

        for (const output of outputs) this.set(output, [id], (result: any) => Reflect.get(result, output))
        return this;
    }

    set(key: string, inputs: string[], fun: Function): any {
        for (const input of inputs) this.setDependant(input, key)
        const self = this;
        LazyProperties.defineProperty(this, key, {
            get: () => {
                console.log('get', key)
                const result = fun(...(inputs.map(input => Reflect.get(self, input))));
                if (isAsyncIterable(result)) {
                    console.log('isAsyncIterable', key, true)
                    result.next(({value}: IteratorResult<any>) => {
                        this.clear(key);
                        Object.defineProperty(this, key, {value})
                    });
                }
                return result;
            },
            configurable: true,
            enumerable: false
        });
        return this;
    }

    private dependants = new Map<string, Set<string>>();

    clear(key: string) {
        console.log('clear', key);
        LazyProperties.resetProperty(this, key);
        for (const dependant of this.getDependants(key)) this.clear(dependant);
    }

    private getDependants(key: string): Set<string> {
        return this.dependants.get(key) || new Set<string>();
    }

    private setDependant(key: string, dependant: string) {
        this.dependants.set(key, this.getDependants(key).add(dependant));
    }
}


