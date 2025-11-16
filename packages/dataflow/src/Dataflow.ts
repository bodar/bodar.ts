import {simpleHash} from "./simpleHash.ts";
import {getInputs, parseFunction} from "./function-parsing.ts";
import {node, type Node} from "./Node.ts";

export class Dataflow {
    define(fun: Function, id = simpleHash(fun.toString())): any {
        const definition = parseFunction(fun);
        const inputs = getInputs(definition);
        // const outputs = getOutputs(definition);
        return this.set(id, inputs, fun)

        // for (const output of outputs) this.set(output, [id], (result: any) => Reflect.get(result, output))
        // return this;
    }

    private nodes = new Map<string, Node>();

    set(key: string, inputs: string[], fun: Function): Node {
        const dependencies = inputs.map(input => this.nodes.get(input)!);
        const newNode = node(key, dependencies, fun);
        this.nodes.set(key, newNode);
        return newNode
    }

    // private dependants = new Map<string, Set<string>>();
    //
    // clear(key: string) {
    //     console.log('clear', key);
    //     LazyProperties.resetProperty(this, key);
    //     for (const dependant of this.getDependants(key)) this.clear(dependant);
    // }
    //
    // private getDependants(key: string): Set<string> {
    //     return this.dependants.get(key) || new Set<string>();
    // }
    //
    // private setDependant(key: string, dependant: string) {
    //     this.dependants.set(key, this.getDependants(key).add(dependant));
    // }
}


