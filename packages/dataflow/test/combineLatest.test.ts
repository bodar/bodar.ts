import {describe, expect, test} from "bun:test";
import {combineLatest} from "../src/combineLatest.ts";
import {toPromiseArray} from "@bodar/totallylazy/collections/Array.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import * as v8 from "node:v8";
import {observableSource} from "./api/observe.test.ts";

async function* values<T>(...values: T[]) {
    for (const v of values) yield v;
}

describe("combineLatest", () => {
    test("works with no inputs", async () => {
        const result = await toPromiseArray(combineLatest([]));
        assertThat(result, equals([[]]));
    });

    test("waits for all sources to emit before producing first value", async () => {
        async function* delayed() {
            await new Promise(resolve => setTimeout(resolve, 10));
            yield 1;
        }

        const result = await toPromiseArray(combineLatest([values(1), delayed()]));
        assertThat(result.length === 1, equals(true));
        assertThat(result[0], equals([1, 1]));
    });

    test("emits latest values from all sources", async () => {
        const result = await toPromiseArray(
            combineLatest([values(1, 2), values('a', 'b')])
        );

        assertThat(result, equals([
            [1, 'a'],
            [2, 'b']
        ]));
    });

    test("emits when any source emits and keeps last value from completed source", async () => {
        const result = await toPromiseArray(
            combineLatest([values(1, 2, 3), values('a')])
        );

        assertThat(result, equals([
            [1, 'a'],
            [2, 'a'],
            [3, 'a']
        ]));
    });

    test("works with three sources", async () => {
        const result = await toPromiseArray(
            combineLatest([values(1, 2), values('a'), values(true, false)])
        );

        assertThat(result, equals([
            [1, 'a', true],
            [2, 'a', false]
        ]));
    });

    test("works with single source", async () => {
        const result = await toPromiseArray(
            combineLatest([values(1, 2, 3)])
        );

        assertThat(result, equals([
            [1],
            [2],
            [3]
        ]));
    });

    test("preserves order of emissions within racing", async () => {
        async function* fast() {
            yield 1;
            yield 2;
            yield 3;
        }

        async function* slow() {
            yield 'a';
            await new Promise(resolve => setTimeout(resolve, 50));
            yield 'b';
        }

        const result = await toPromiseArray(combineLatest([fast(), slow()]));

        assertThat(result, equals([
            [1, 'a'],
            [2, 'a'],
            [3, 'a'],
            [3, 'b']
        ]));

    });

    describe.skip('memory-leak', () => {
        async function* slow() {
            let i = 0;
            while (true) {
                await new Promise(r => setTimeout(r, 1)); // slow - never resolves quickly
                yield i++;
            }
        }

        async function* fast(count: number) {
            for (let i = 0; i < count; i++) {
                yield i;
                await Promise.resolve(); // yield to event loop
            }
        }

        const iterations = 1000000;

        async function garbageCollect() {
            Bun.gc(true);
            await new Promise(r => setTimeout(r, 1));
        }

        test("Does not leak with infinite slow iterator", async () => {
            await garbageCollect();

            const before = process.memoryUsage().heapUsed;

            let combined: any = combineLatest([slow(), fast(iterations)]);
            let count = 0;
            for await (const _ of combined) {
                count++;
                if (count >= iterations) break;
            }

            await garbageCollect();

            const after = process.memoryUsage().heapUsed;
            const growth = after - before;

            console.log(`NEW - Heap before: ${(before / 1024 / 1024).toFixed(2)} MB`);
            console.log(`NEW - Heap after: ${(after / 1024 / 1024).toFixed(2)} MB`);
            console.log(`NEW - Growth: ${(growth / 1024 / 1024).toFixed(2)} MB`);

            // Creates a heap snapshot file with an auto-generated name
            const snapshotPath = v8.writeHeapSnapshot();
            console.log(`Heap snapshot written to: ${snapshotPath}`);

            expect(growth).toBeLessThan(5 * 1024 * 1024);
        }, 20000);
    })

    describe("infinite source with single-value dependent", () => {
        test("iteration blocks waiting for next value from infinite source", async () => {
            const emitted: number[] = [];
            let emitValue: ((value: number) => void) | undefined;

            // Infinite source - emits when we call emitValue()
            async function* infinite(): AsyncGenerator<number> {
                while (true) {
                    const value = await new Promise<number>(r => { emitValue = r; });
                    yield value;
                }
            }

            const gen = infinite();
            const combined = combineLatest([gen]);
            const iterator = combined[Symbol.asyncIterator]();

            // Request first value (this will block until emitValue is called)
            const firstPromise = iterator.next();

            // Wait a tick for the generator to set up emitValue
            await new Promise(r => setTimeout(r, 10));
            expect(emitValue).toBeDefined();

            // Now emit the first value
            emitValue!(1);
            const first = await firstPromise;
            expect(first.value).toEqual([1]);
            expect(first.done).toBe(false);
            emitted.push(1);

            // Request second value (blocks waiting)
            const secondPromise = iterator.next();
            await new Promise(r => setTimeout(r, 10));

            // Emit second value
            emitValue!(2);
            const second = await secondPromise;
            expect(second.value).toEqual([2]);
            expect(second.done).toBe(false);
            emitted.push(2);

            // Break out - this should trigger cleanup
            await iterator.return?.();

            expect(emitted).toEqual([1, 2]);
        });
    });

    describe("life cycle", () => {
        test("when we have finished observing, we clean up", async () => {
            const sourceA = observableSource(1, 2);
            const sourceB = observableSource('a');

            const result = await toPromiseArray(combineLatest([sourceA, sourceB]));

            assertThat(result, equals([[1, 'a'], [2, 'a']]));
            expect(sourceA.disposed).toBe(true);
            expect(sourceB.disposed).toBe(true);
        });

        test("if we break early, we still clean up", async () => {
            const sourceA = observableSource(1, 2);
            const sourceB = observableSource('a');

            for await (const input of combineLatest([sourceA, sourceB])) {
                expect(input).toEqual([1, 'a']);
                break;
            }

            expect(sourceA.disposed).toBe(true);
            expect(sourceB.disposed).toBe(true);
        });

        test("if we throw, we still clean up", async () => {
            const sourceA = observableSource(1, 2);
            const sourceB = observableSource('a');

            try {
                for await (const input of combineLatest([sourceA, sourceB])) {
                    expect(input).toEqual([1, 'a']);
                    throw new Error("we throw, we still clean up");
                }
            } catch (_) {
                // ignore
            }

            expect(sourceA.disposed).toBe(true);
            expect(sourceB.disposed).toBe(true);
        });
    })


});
