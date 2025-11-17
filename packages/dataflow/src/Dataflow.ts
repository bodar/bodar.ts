import {simpleHash} from "./simpleHash.ts";
import {getInputs, getOutputs, parseFunction} from "./function-parsing.ts";
import {node, type Node} from "./Node.ts";

export class Dataflow {
    define(fun:Function): { [id: string]: Node };
    define(key: string, fun: Function): { [id: string]: Node };
    define(...args:any[]): { [id: string]: Node } {
        const fun = args.find(v => typeof v === "function")!;
        const key = args.find(v => typeof v === 'string') || (fun.name === '' ? simpleHash(fun.toString()) : fun.name);
        const definition = parseFunction(fun);
        const inputs = getInputs(definition);
        const outputs = getOutputs(definition);

        return Object.fromEntries([
            [key, this.set(key, inputs, fun)],
            ...outputs.map(output => [output, this.set(output, [key], (result: any) => Reflect.get(result, output))])
        ])
    }

    private nodes = new Map<string, Node>();

    set(key: string, inputs: string[], fun: Function): Node {
        const dependencies = inputs.map(input => this.nodes.get(input)!);
        const newNode = node(key, dependencies, fun);
        this.nodes.set(key, newNode);
        return newNode
    }
}


