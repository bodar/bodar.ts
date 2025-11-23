/**
 * Core dataflow graph that manages reactive nodes and their dependencies
 * @module
 */
import {type Node} from "./Node.ts";
import {node, PullNode} from "./PullNode.ts";
import {Backpressure, type BackpressureStrategy} from "./SharedAsyncIterable.ts";
import {Throttle, type ThrottleStrategy} from "./Throttle.ts";

/** A Graph with no function parsing or automatic logic */
export class BaseGraph {
    constructor(private backpressure: BackpressureStrategy = Backpressure.fastest,
                private throttle: ThrottleStrategy = Throttle.auto()) {
    }

    /** Creates nodes explicit parameters */
    define(key: string, inputs: string[], outputs: string[], fun: Function): { [id: string]: Node<any> } {
        return Object.fromEntries([
            [key, this.set(key, inputs, fun)],
            ...outputs.map(output => [output, this.set(output, [key], (result: any) => Reflect.get(result, output))])
        ])
    }

    private nodes = new Map<string, PullNode<any>>();

    /** Creates and registers a node with explicit key, inputs, and function */
    set(key: string, inputs: string[], fun: Function): Node<any> {
        // Validate all input dependencies exist
        const missing = inputs.filter(input => !this.nodes.has(input));
        if (missing.length > 0) {
            throw new Error(`Cannot set node "${key}": missing dependencies [${missing.join(', ')}]`);
        }

        const dependencies = inputs.map(input => this.nodes.get(input)!);
        const newNode = node(key, dependencies, fun, this.backpressure, this.throttle);
        this.nodes.set(key, newNode);
        return newNode
    }

    sinks(): Node<any>[] {
        const keys = new Set(this.nodes.keys());
        for (const node of this.nodes.values()) {
            for (const dependency of node.dependencies) {
                keys.delete(dependency.key)
            }
        }
        return Array.from(keys).map(node => this.nodes.get(node)!)
    }

    sources(): Node<any>[] {
        return Array.from(this.nodes.values().filter(n => n.dependencies.length === 0));
    }
}


