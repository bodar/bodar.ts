/**
 * Core dataflow graph that manages reactive nodes and their dependencies
 * @module
 */
import {simpleHash} from "./simpleHash.ts";
import {getInputs, getOutputs, parseFunction} from "./function-parsing.ts";
import {node, Node} from "./Node.ts";
import {Backpressure, type BackpressureStrategy} from "./SharedAsyncIterable.ts";
import {lazy} from "@bodar/totallylazy/functions/lazy.ts";

/** Manages a graph of reactive nodes with automatic dependency tracking */
export class Graph {
    constructor(private backpressure: BackpressureStrategy = Backpressure.fastest) {
    }

    /** Creates nodes from a function, parsing inputs/outputs to build the dependency graph */
    define(fun:Function): { [id: string]: Node<any> };
    define(key: string, fun: Function): { [id: string]: Node<any> };
    define(key: string, inputs: string[], outputs: string[], fun: Function): { [id: string]: Node<any> };
    define(...args:any[]): { [id: string]: Node<any> } {
        const fun = args.find(v => typeof v === "function")!;
        const key = args.find(v => typeof v === 'string') || (fun.name === '' ? simpleHash(fun.toString()) : fun.name);
        const definition = lazy(() =>  parseFunction(fun));
        const [inputs = getInputs(definition), outputs = getOutputs(definition)] = args.filter(Array.isArray) as string[][];
        return Object.fromEntries([
            [key, this.set(key, inputs, fun)],
            ...outputs.map(output => [output, this.set(output, [key], (result: any) => Reflect.get(result, output))])
        ])
    }

    private nodes = new Map<string, Node<any>>();

    /** Creates and registers a node with explicit key, inputs, and function */
    set(key: string, inputs: string[], fun: Function): Node<any> {
        const dependencies = inputs.map(input => this.nodes.get(input)!);
        const newNode = node(key, dependencies, fun, this.backpressure);
        this.nodes.set(key, newNode);
        return newNode
    }
}


