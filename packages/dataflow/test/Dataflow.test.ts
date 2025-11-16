import {describe, expect, test} from "bun:test";
import {Dataflow} from "../src/Dataflow.ts";
import {Mutable} from "../src/Mutable.ts";

describe("Dataflow", () => {
    test("can set using a function", async () => {
        const dataflow = new Dataflow();
        const cell = dataflow.define(() => ({a: 1}));
        for await (const value of cell) {
            expect(value.a).toBe(1);

        }
        expect(cell[]).toEqual(3);
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

