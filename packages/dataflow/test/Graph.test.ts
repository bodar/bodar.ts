import {describe, test} from "bun:test";
import {Graph} from "../src/Graph.ts";
import {toPromiseArray} from "@bodar/totallylazy/collections/Array.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import type {Version} from "../src/Node.ts";

describe("graph", () => {
    test("if the function has a name use that as the key", async () => {
        const graph = new Graph();
        const {constant} = graph.define(function constant() {
            return 1;
        });
        assertThat(await valuesOf(constant), equals([1]));
    });

    test("otherwise calculate the hash of the function source", async () => {
        const graph = new Graph();
        const {rmbt6f} = graph.define(function () {
            return 1;
        });
        assertThat(await valuesOf(rmbt6f), equals([1]));
    });

    test("can provide a key explicitly", async () => {
        const graph = new Graph();
        const {fun} = graph.define('fun', function () {
            return 1;
        });
        assertThat(await valuesOf(fun), equals([1]));
    });

    test("can create a node from a function that returns a value, if it has no inputs it only ever have 1 result", async () => {
        const graph = new Graph();
        const {node} = graph.define('node', () => 1);
        assertThat(await valuesOf(node), equals([1]));
    });

    test("Can iterate multiple times and it still returns the same state", async () => {
        const graph = new Graph();
        const {node} = graph.define('node', () => 1);
        assertThat(await valuesOf(node), equals([1]));
        assertThat(await valuesOf(node), equals([1]));
    });

    test("nodes can depend on other nodes", async () => {
        const graph = new Graph();
        graph.define("nodeA", () => 1);
        const {nodeB} = graph.define('nodeB', (nodeA: number) => nodeA * 2);
        assertThat(await valuesOf(nodeB), equals([2]));
    });

    test("functions are only called once unless their input change", async () => {
        const graph = new Graph();
        let count = 0;
        const {node} = graph.define(function node() {
            count++;
            return 1;
        });
        assertThat(count, is(0));
        assertThat(await valuesOf(node), equals([1]));
        assertThat(count, is(1));
        assertThat(await valuesOf(node), equals([1]));
        assertThat(count, is(1));
    });

    test("if a dependency returns the same value multiple times in a row, it will still cause the function to execute", async () => {
        const graph = new Graph();
        graph.define(function* datasource() {
            yield* [1, 1, 1];
        });
        let sum = 0;
        const {node} = graph.define('node', (datasource: number) => sum += datasource);
        assertThat(sum, is(0));
        assertThat(await valuesOf(node), equals([1, 2, 3]));
    });

    test("if a function returns an generator then the node will yield the values not the generator", async () => {
        const graph = new Graph();
        const {test} = graph.define(function* test() {
            yield* [1, 2, 3];
        });
        const result = await valuesOf(test);
        assertThat(result, equals([1, 2, 3]));
    });

    test("if a function returns an async iterable it will yield the values", async () => {
        const graph = new Graph();
        const {test} = graph.define(function test() {
            return {
                async* [Symbol.asyncIterator]() {
                    yield* [1, 2, 3];
                }
            }
        });
        assertThat(await valuesOf(test), equals([1, 2, 3]));
    });

    test("if a function returns a promise then the node will yield the value of the promise", async () => {
        const graph = new Graph();
        graph.define('promise', () => Promise.resolve(2));
        const {test} = graph.define(function test(promise: number) {
            return promise * 3;
        });
        assertThat(await valuesOf(test), equals([6]));
    });

    test("can compose generators with constants", async () => {
        const graph = new Graph();
        graph.define('constant', () => 10);
        graph.define(function* generator() {
            yield* [1, 2, 3];
        });
        const {combined} = graph.define(function combined(constant: number, generator: number) {
            return constant * generator
        });
        assertThat(await valuesOf(combined), equals([10, 20, 30]));
    });

    test("if a function returns multiple things then it will create multiple nodes", async () => {
        const graph = new Graph();
        const {fun, a, b} = graph.define('fun', () => ({a: 1, b: 2}));
        assertThat(await valuesOf(fun), equals([{a: 1, b: 2}]));
        assertThat(await valuesOf(a), equals([1]));
        assertThat(await valuesOf(b), equals([2]));
    });

    test("generators still work when there are multiple objects returned", async () => {
        const graph = new Graph();
        const {b} = graph.define('fun', () => ({
            a: 1, b: function* () {
                yield* [1, 2, 3];
            }
        }));
        assertThat(await valuesOf(b), equals([1, 2, 3]));
    });

    test("can detect the sink nodes of the graph", async () => {
        const graph = new Graph();
        graph.define('a', () => 1);
        graph.define('b', (a: number) => a + 2);
        graph.define('c', () => 3);
        const {d} = graph.define('d', (b: number, c: number) => b + c + 4);
        const {e} = graph.define('e', () => 5);
        assertThat(graph.sinks(), equals([d, e]));
    });

    test("can detect the source nodes of the graph", async () => {
        const graph = new Graph();
        const {a} = graph.define('a', () => 1);
        graph.define('b', (a: number) => a + 2);
        const {c} = graph.define('c', () => 3);
        graph.define('d', (b: number, c: number) => b + c + 4);
        const {e} = graph.define('e', () => 5);
        assertThat(graph.sources(), equals([a, c, e]));
    });
})

async function valuesOf<T>(iterable: AsyncIterable<Version<T>>): Promise<T[]> {
    const result = await toPromiseArray(iterable);
    return result.map(v => v.value);
}
