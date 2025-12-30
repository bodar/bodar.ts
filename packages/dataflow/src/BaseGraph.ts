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
                private throttle: ThrottleStrategy = Throttle.auto(),
                private globals: any = globalThis) {
    }

    /** Creates nodes explicit parameters */
    define(key: string, inputs: string[], outputs: string[], fun: Function): { [id: string]: Node<any> } {
        return Object.fromEntries([
            [key, this.set(key, inputs, fun)],
            ...outputs.map(output => [output, this.set(output, [key], (result: any) => Reflect.get(result, output))])
        ])
    }

    private nodes = new Map<string, PullNode<any>>();

    /** Returns node by key if it exists */
    get(key: string): Node<any> | undefined {
        return this.nodes.get(key)
    }

    /** Creates and registers a node with explicit key, inputs, and function */
    set(key: string, inputs: string[], fun: Function): Node<any> {
        // Auto-register missing dependencies from globals (lazy lookup)
        for (const input of inputs) {
            if (!this.nodes.has(input)) {
                const globalNode = node(input, [], () => Reflect.get(this.globals, input), this.backpressure, this.throttle);
                this.nodes.set(input, globalNode);
            }
        }

        const dependencies = inputs.map(input => this.nodes.get(input)!);
        const newNode = node(key, dependencies, fun, this.backpressure, this.throttle);
        this.nodes.set(key, newNode);
        return newNode
    }

    /** Returns nodes with no dependents */
    sinks(): Node<any>[] {
        const keys = new Set(this.nodes.keys());
        for (const node of this.nodes.values()) {
            for (const dependency of node.dependencies) {
                keys.delete(dependency.key)
            }
        }
        return Array.from(keys).map(node => this.nodes.get(node)!)
    }

    /** Returns nodes with no dependencies */
    sources(): Node<any>[] {
        return Array.from(this.nodes.values().filter(n => n.dependencies.length === 0));
    }

    /** Returns all nodes that depend on the given node */
    dependents(node: Node<any>): Node<any>[] {
        return Array.from(this.nodes.values().filter(n => n.dependencies.some(d => d.key === node.key)));
    }

    /** Starts consuming all sink nodes */
    run(): void {
        this.sinks().forEach(async node => {
            for await (const value of node) void (value);
        });
    }
}


