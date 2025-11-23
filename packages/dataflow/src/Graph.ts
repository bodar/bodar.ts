/**
 * Core dataflow graph that manages reactive nodes and their dependencies
 * @module
 */
import {simpleHash} from "./simpleHash.ts";
import {getInputs, getOutputs, parseFunction} from "./function-parsing.ts";
import {Node} from "./Node.ts";
import {Backpressure, type BackpressureStrategy} from "./SharedAsyncIterable.ts";
import {lazy} from "@bodar/totallylazy/functions/lazy.ts";
import {Throttle, type ThrottleStrategy} from "./Throttle.ts";
import {BaseGraph} from "./BaseGraph.ts";

/** Manages a graph of reactive nodes with automatic dependency tracking */
export class Graph extends BaseGraph {
    constructor(backpressure: BackpressureStrategy = Backpressure.fastest,
                throttle: ThrottleStrategy = Throttle.auto()) {
        super(backpressure, throttle);
    }

    /** Creates nodes from a function, parsing inputs/outputs to build the dependency graph */
    define(fun: Function): { [id: string]: Node<any> };
    define(key: string, fun: Function): { [id: string]: Node<any> };
    define(key: string, inputs: string[], outputs: string[], fun: Function): { [id: string]: Node<any> };
    define(...args: any[]): { [id: string]: Node<any> } {
        const fun = args.find(v => typeof v === "function")!;
        const key = args.find(v => typeof v === 'string') || (fun.name === '' ? simpleHash(fun.toString()) : fun.name);
        const definition = lazy(() => parseFunction(fun));
        const [inputs = getInputs(definition), outputs = getOutputs(definition)] = args.filter(Array.isArray) as string[][];
        return super.define(key, inputs, outputs, fun);
    }
}


