import {describe, expect, test} from "bun:test";
import {Dataflow} from "../src/Dataflow.ts";
import {Mutable} from "../src/Mutable.ts";
import {toPromiseArray} from "@bodar/totallylazy/collections/Array.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";

describe("Dataflow", () => {
    test("can create a node from a function that returns a value, if it has no inputs it only ever have 1 result", async () => {
        const dataflow = new Dataflow();
        const node = dataflow.define(() => 1);
        assertThat(await toPromiseArray(node), equals([1]));
    });

    test("Can iterable multiple times and it still returns the same state", async () => {
        const dataflow = new Dataflow();
        const node = dataflow.define(() => 1);
        assertThat(await toPromiseArray(node), equals([1]));
        assertThat(await toPromiseArray(node), equals([1]));
    });

    test("nodes can depend on other nodes", async () => {
        const dataflow = new Dataflow();
        dataflow.define(() => 1, "nodeA");
        const nodeB = dataflow.define((nodeA: number) => nodeA * 2);
        assertThat(await toPromiseArray(nodeB), equals([2]));
    });

    test("functions are only called once unless their input change", async () => {
        const dataflow = new Dataflow();
        let count = 0;
        const node = dataflow.define(() => {
            count++;
            return 1;
        });
        assertThat(count, is(0));
        assertThat(await toPromiseArray(node), equals([1]));
        assertThat(count, is(1));
        assertThat(await toPromiseArray(node), equals([1]));
        assertThat(count, is(1));
    });

    test("if a function returns an generator then the node will yield the values not the generator", async () => {
        const dataflow = new Dataflow();
        const node = dataflow.set('test', [], function* () {yield* [1, 2, 3];});
        assertThat(await toPromiseArray(node), equals([1, 2, 3]));
    });

    test("can compose generators with constants", async () => {
        const dataflow = new Dataflow();
        dataflow.set('constant', [], () => 10);
        dataflow.set('generator', [], function* () {yield* [1, 2, 3];});
        const node = dataflow.set('composed', ['constant', 'generator'], (constant:number, generator:number) => constant * generator);
        assertThat(await toPromiseArray(node), equals([10, 20, 30]));
    });


    // test("can set using a function", () => {
    //     const dataflow = new Dataflow()
    //         .define(() => ({a: 1, b: 2}))
    //         .define((a: number, b: number) => ({result: a + b}));
    //     expect(dataflow.result).toEqual(3);
    // });
    //
    // test("functions are only called once", () => {
    //     let count = 0;
    //     const dataflow = new Dataflow()
    //         .define(() => {
    //             count++;
    //             return ({a: 1, b: 2});
    //         })
    //         .define((a: number, b: number) => ({result: a + b}));
    //     expect(count).toEqual(0);
    //     expect(dataflow.result).toEqual(3);
    //     expect(count).toEqual(1);
    //     expect(dataflow.result).toEqual(3);
    //     expect(count).toEqual(1);
    // });
    //
    // test("if output is a async iterable, when a new value arrives it should cascade through", async () => {
    //     const a = Mutable(1);
    //     const dataflow = new Dataflow()
    //         .define(() => ({a, b: 2}))
    //         .define((a: Mutable<number>, b: number) => ({result: a.value + b}))
    //         .define((result: number) => ({final: result + 10}));
    //
    //     expect(dataflow.a.value).toEqual(1);
    //     expect(dataflow.b).toEqual(2);
    //     expect(dataflow.result).toEqual(3);
    //     expect(dataflow.final).toEqual(13);
    //     a.value++;
    //     await new Promise((resolve) => setTimeout(resolve, 1));
    //     expect(dataflow.a.value).toEqual(2);
    //     expect(dataflow.b).toEqual(2);
    //     expect(dataflow.result).toEqual(4);
    //     expect(dataflow.final).toEqual(14);
    //
    // });
})

describe("Mutable", () => {
    test("is a generator of values", async () => {
        const numbers = Mutable(1);
        expect(await numbers.next()).toEqual({value: 1, done: false});
        numbers.value++;
        expect(await numbers.next()).toEqual({value: 2, done: false});
        numbers.value++;
        expect(await numbers.next()).toEqual({value: 3, done: false});
    });
});

