/**
 * Core dataflow graph that manages reactive nodes and their dependencies
 * @module
 */
import {type Node} from "./Node.ts";
import {Backpressure, type BackpressureStrategy} from "./SharedAsyncIterable.ts";
import {lazy} from "@bodar/totallylazy/functions/lazy.ts";
import {Throttle, type ThrottleStrategy} from "./Throttle.ts";
import {BaseGraph} from "./BaseGraph.ts";
import {parseFunction} from "./javascript/parseFunction.ts";
import {getOutputs} from "./javascript/outputs.ts";
import {getInputs} from "./javascript/inputs.ts";
import {type IdGenerator, SimpleHashGenerator} from "./IdGenerator.ts";

/** Manages a graph of reactive nodes with automatic dependency tracking */
export class Graph extends BaseGraph {
    constructor(backpressure: BackpressureStrategy = Backpressure.fastest,
                throttle: ThrottleStrategy = Throttle.auto(),
                private idGenerator: IdGenerator = SimpleHashGenerator) {
        super(backpressure, throttle);
    }

    /** Creates nodes from a function, parsing inputs/outputs to build the dependency graph */
    define(fun: Function): { [id: string]: Node<any> };
    define(key: string, fun: Function): { [id: string]: Node<any> };
    define(key: string, inputs: string[], outputs: string[], fun: Function): { [id: string]: Node<any> };
    define(...args: any[]): { [id: string]: Node<any> } {
        const fun = args.find(v => typeof v === "function")!;
        const key = args.find(v => typeof v === 'string') || (fun.name === '' ? this.idGenerator.generate(fun.toString()) : fun.name);
        const definition = lazy(() => parseFunction(fun));
        const [inputs = getInputs(definition), outputs = getOutputs(definition)] = args.filter(Array.isArray) as string[][];
        return super.define(key, inputs, outputs, fun);
    }
}


