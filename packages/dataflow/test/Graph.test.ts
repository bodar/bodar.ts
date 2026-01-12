import {describe, expect, test} from "bun:test";
import {Graph} from "../src/Graph.ts";
import {toPromiseArray} from "@bodar/totallylazy/collections/Array.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {observableSource} from "./api/observe.test.ts";
import {Mutable, mutable} from "../src/api/mutable.ts";
import {Invalidator} from "../src/Invalidator.ts";
import {Backpressure} from "../src/SharedAsyncIterable.ts";
import {Throttle} from "../src/Throttle.ts";

describe("graph", () => {
    test("if the function has a name use that as the key", async () => {
        const graph = new Graph();
        const {constant} = graph.define(function constant() {
            return 1;
        });
        assertThat(await toPromiseArray(constant), equals([1]));
    });

    test("otherwise calculate the hash of the function source", async () => {
        const graph = new Graph();
        const {rmbt6f} = graph.define(function () {
            return 1;
        });
        assertThat(await toPromiseArray(rmbt6f), equals([1]));
    });

    test("can provide a key explicitly", async () => {
        const graph = new Graph();
        const {fun} = graph.define('fun', function () {
            return 1;
        });
        assertThat(await toPromiseArray(fun), equals([1]));
    });

    test("can create a node from a function that returns a value, if it has no inputs it only ever have 1 result", async () => {
        const graph = new Graph();
        const {node} = graph.define('node', () => 1);
        assertThat(await toPromiseArray(node), equals([1]));
    });

    test("Can iterate multiple times and it still returns the same state", async () => {
        const graph = new Graph();
        const {node} = graph.define('node', () => 1);
        assertThat(await toPromiseArray(node), equals([1]));
        assertThat(await toPromiseArray(node), equals([1]));
    });

    test("nodes can depend on other nodes", async () => {
        const graph = new Graph();
        graph.define("nodeA", () => 1);
        const {nodeB} = graph.define('nodeB', (nodeA: number) => nodeA * 2);
        assertThat(await toPromiseArray(nodeB), equals([2]));
    });

    test("if a dependency returns the same value multiple times in a row, it will still cause the function to execute", async () => {
        const graph = new Graph();
        graph.define(function* datasource() {
            yield* [1, 2, 3];
        });
        let sum = 0;
        const {node} = graph.define('node', (datasource: number) => sum += datasource);
        assertThat(sum, is(0));
        assertThat(await toPromiseArray(node), equals([1, 3, 6]));
    });

    test("if a function returns an generator then the node will yield the values not the generator", async () => {
        const graph = new Graph();
        const {test} = graph.define(function* test() {
            yield* [1, 2, 3];
        });
        const result = await toPromiseArray(test);
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
        assertThat(await toPromiseArray(test), equals([1, 2, 3]));
    });

    test("if a function returns a promise then the node will yield the value of the promise", async () => {
        const graph = new Graph();
        graph.define('promise', () => Promise.resolve(2));
        const {test} = graph.define(function test(promise: number) {
            return promise * 3;
        });
        assertThat(await toPromiseArray(test), equals([6]));
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
        assertThat(await toPromiseArray(combined), equals([10, 20, 30]));
    });

    test("if a function returns multiple things then it will create multiple nodes", async () => {
        const graph = new Graph();
        const {fun, a, b} = graph.define('fun', () => ({a: 1, b: 2}));
        assertThat(await toPromiseArray(fun), equals([{a: 1, b: 2}]));
        assertThat(await toPromiseArray(a), equals([1]));
        assertThat(await toPromiseArray(b), equals([2]));
    });

    test("generators still work when there are multiple objects returned", async () => {
        const graph = new Graph();
        const {b} = graph.define('fun', () => ({
            a: 1, b: function* () {
                yield* [1, 2, 3];
            }
        }));
        assertThat(await toPromiseArray(b), equals([1, 2, 3]));
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

    test("can detect direct dependents of a node", async () => {
        const graph = new Graph();
        const {a} = graph.define('a', () => 1);
        const {b} = graph.define('b', (a: number) => a + 2);
        const {c} = graph.define('c', () => 3);
        const {d} = graph.define('d', (b: number, c: number) => b + c + 4);
        assertThat(graph.dependents(a), equals([b]));
        assertThat(graph.dependents(b), equals([d]));
        assertThat(graph.dependents(c), equals([d]));
        assertThat(graph.dependents(d), equals([]));
    });

    test("dependents returns multiple nodes when node has multiple dependents", async () => {
        const graph = new Graph();
        const {a} = graph.define('a', () => 1);
        const {b} = graph.define('b', (a: number) => a + 2);
        const {c} = graph.define('c', (a: number) => a + 3);
        const {d} = graph.define('d', (a: number) => a + 4);
        assertThat(graph.dependents(a), equals([b, c, d]));
    });

    test("when a dependency returns a mutable, and the parent dependency changes, the old mutable is disposed and a new one is created", async () => {
        const graph = new Graph();
        const oscillator_type = mutable('sine');
        graph.define('oscillator_type', () => oscillator_type);
        graph.define('oscillator', (oscillator_type: string) =>
            `oscillator(${oscillator_type})`);
        let oscillator_frequency: Mutable<number>;
        graph.define('oscillator_frequency', (oscillator: string) =>
            oscillator_frequency = mutable(oscillator.length * 440));
        const {oscillator_frequency_span} = graph.define('oscillator_frequency_span', (oscillator_frequency: number) =>
            `${oscillator_frequency} Hz`);
        const iterator = oscillator_frequency_span[Symbol.asyncIterator]();
        expect(await iterator.next()).toEqual({value: '7040 Hz', done: false});
        oscillator_frequency!.value++;
        expect(await iterator.next()).toEqual({value: '7041 Hz', done: false});
        oscillator_type.value = 'square'
        expect(await iterator.next()).toEqual({value: '7920 Hz', done: false});
        oscillator_frequency!.value++;
        expect(await iterator.next()).toEqual({value: '7921 Hz', done: false});
        oscillator_type.value = 'sawtooth'
        expect(await iterator.next()).toEqual({value: '8800 Hz', done: false});
        oscillator_frequency!.value++;
        expect(await iterator.next()).toEqual({value: '8801 Hz', done: false});
    });

    describe("invalidation", () => {
        test("AbortController is aborted when new inputs arrive", async () => {
            const graph = new Graph();
            graph.define(function* datasource() {
                yield* [1, 2];
            });
            const controllers: AbortController[] = [];
            const {node} = graph.define('node', (datasource: number) => {
                void (datasource);
                const controller = new AbortController();
                controllers.push(controller);
                return controller;
            });
            await toPromiseArray(node);
            expect(controllers.length).toBe(2);
            expect(controllers[0].signal.aborted).toBe(true);
            expect(controllers[1].signal.aborted).toBe(false);
        });

        test("AbortController abort signal fires when inputs change during pending promise", async () => {
            const graph = new Graph();
            const query = mutable('a');
            graph.define('query', () => query);

            const abortedQueries: string[] = [];

            // Simulates the search function from reactivity.html
            const {results} = graph.define('results', (query: string) => {
                const controller = new AbortController();
                new Promise<{query: string, aborted: boolean}>((resolve) => {
                    const id = setTimeout(() => resolve({query, aborted: false}), 100);
                    controller.signal.addEventListener('abort', () => {
                        clearTimeout(id);
                        abortedQueries.push(query);  // Track aborted queries
                        resolve({query, aborted: true});
                    });
                });
                // Return controller so it gets invalidated
                return controller;
            });

            const iterator = results[Symbol.asyncIterator]();

            // Get first result
            const first = await iterator.next();
            expect(first.value).toBeInstanceOf(AbortController);

            // Change query - should abort the pending operation
            query.value = 'ap';

            // Get second result
            const second = await iterator.next();
            expect(second.value).toBeInstanceOf(AbortController);

            // Verify first was aborted
            expect(abortedQueries).toContain('a');
        });

        test("Symbol.dispose is called when new inputs arrive", async () => {
            const graph = new Graph();
            graph.define(function* datasource() {
                yield* [1, 2];
            });
            const disposals: number[] = [];
            const {node} = graph.define('node', (datasource: number) => ({
                value: datasource,
                [Symbol.dispose]() {
                    disposals.push(datasource);
                }
            }));
            await toPromiseArray(node);
            expect(disposals).toEqual([1]);
        });

        test("Symbol.asyncDispose is awaited when new inputs arrive", async () => {
            const graph = new Graph();
            graph.define(function* datasource() {
                yield* [1, 2];
            });
            const disposals: number[] = [];
            const {node} = graph.define('node', (datasource: number) => ({
                value: datasource,
                async [Symbol.asyncDispose]() {
                    await Promise.resolve();
                    disposals.push(datasource);
                }
            }));
            await toPromiseArray(node);
            expect(disposals).toEqual([1]);
        });

        test("custom invalidation rules are applied when new inputs arrive", async () => {
            const invalidator = new Invalidator();
            const disconnected: string[] = [];
            invalidator.add(
                value => typeof value?.disconnect === 'function',
                value => disconnected.push(value.name)
            );

            const graph = new Graph(Backpressure.fastest, Throttle.auto(), invalidator);
            graph.define(function* datasource() {
                yield* ['sine', 'square'];
            });
            const {node} = graph.define('node', (datasource: string) => ({
                name: datasource,
                disconnect() {}
            }));

            await toPromiseArray(node);
            expect(disconnected).toEqual(['sine']);
        });
    });

    describe("life cycle", () => {
        test("when we have finished observing, we clean up", async () => {
            const graph = new Graph();
            const source = observableSource(1, 2);
            graph.define('source', () => source);
            const {node} = graph.define('node', (source: number) => source * 2);

            assertThat(await toPromiseArray(node), equals([2, 4]));
            expect(source.disposed).toBe(true);
        });

        test("if we break early, we still clean up", async () => {
            const graph = new Graph();
            const source = observableSource(1, 2);
            graph.define('source', () => source);
            const {node} = graph.define('node', (source: number) => source * 2);

            for await (const v of node) {
                expect(v).toBe(2);
                break;
            }

            expect(source.disposed).toBe(true);
        });

        test("if we throw, we still clean up", async () => {
            const graph = new Graph();
            const source = observableSource(1, 2);
            graph.define('source', () => source);
            const {node} = graph.define('node', (source: number) => source * 2);

            try {
                for await (const v of node) {
                    expect(v.value).toBe(2);
                    throw new Error("we throw, we still clean up");
                }
            } catch (_) {
                // ignore
            }

            expect(source.disposed).toBe(true);
        });

        test("if a source yields a new input while we are yielding it interrupts and cleans up", async () => {
            const graph = new Graph();
            const source = mutable(1);
            graph.define('source', () => source);
            let disposed = 0;
            let count = 0;
            const {generator} = graph.define(function* generator(source: number) {
                try {
                    while (true) {
                        yield source * count++;
                    }
                } finally {
                    disposed++;
                }
            });

            const iterator = generator[Symbol.asyncIterator]();
            expect(await iterator.next()).toEqual({done: false, value: 0});
            expect(await iterator.next()).toEqual({done: false, value: 1});
            expect(await iterator.next()).toEqual({done: false, value: 2});
            expect(disposed).toEqual(0);
            source.value = 10;
            expect(disposed).toEqual(0);
            // The old iterator's pending result is discarded when the new input arrives.
            // The count++ already happened (count went from 3 to 4), so new generator starts with count=4.
            expect(await iterator.next()).toEqual({done: false, value: 40});
            expect(disposed).toEqual(1);
            expect(await iterator.next()).toEqual({done: false, value: 50});
            expect(disposed).toEqual(1);
            expect(await iterator.next()).toEqual({done: false, value: 60});
            expect(disposed).toEqual(1);
        });

        test("invalidating an async generator that is awaiting a promise that will never resolve does not hang", async () => {
            const graph = new Graph();
            const trigger = mutable<number | undefined>(1);
            graph.define('trigger', () => trigger);
            const {source} = graph.define(async function* source(trigger: number) {
                if (trigger === 1) yield 1;
                if (trigger === 2) await new Promise(() => {}); // never resolves
            });

            // Queue up mutations: 1 -> 2 -> 1 -> undefined
            setTimeout(() => trigger.value = 2, 10);       // creates stuck generator
            setTimeout(() => trigger.value = 1, 20);       // invalidates stuck, yields 1 again
            setTimeout(() => trigger.value = undefined, 30); // terminates

            assertThat(await toPromiseArray(source), equals([1, 1]));
        });
    });
})

