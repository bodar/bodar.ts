import {describe, test} from "bun:test";
import {SharedAsyncIterable, Backpressure} from "../src/SharedAsyncIterable.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {toPromiseArray} from "@bodar/totallylazy/collections/Array.ts";

async function* numbers(...values: number[]) {
    for (const v of values) yield v;
}

describe("SharedAsyncIterator", () => {
    describe("Backpressure.slowest", () => {
        test("single consumer works normally", async () => {
            const shared = new SharedAsyncIterable(numbers(1, 2, 3), Backpressure.slowest);
            const iter = shared[Symbol.asyncIterator]();

            assertThat(await iter.next(), equals({value: 1, done: false}));
            assertThat(await iter.next(), equals({value: 2, done: false}));
            assertThat(await iter.next(), equals({value: 3, done: false}));
            assertThat(await iter.next(), equals({done: true, value: undefined}));
        });

        test("two consumers synchronized - both must call next before advancing", async () => {
            let sourceCallCount = 0;

            async function* counted() {
                for (const v of [1, 2]) {
                    sourceCallCount++;
                    yield v;
                }
            }

            const shared = new SharedAsyncIterable(counted(), Backpressure.slowest);
            const iter1 = shared[Symbol.asyncIterator]();
            const iter2 = shared[Symbol.asyncIterator]();

            // Both call next - should only advance source once
            const [result1, result2] = await Promise.all([iter1.next(), iter2.next()]);

            assertThat(result1, equals({value: 1, done: false}));
            assertThat(result2, equals({value: 1, done: false}));
            assertThat(sourceCallCount, equals(1));

            // Both advance again
            const [result3, result4] = await Promise.all([iter1.next(), iter2.next()]);

            assertThat(result3, equals({value: 2, done: false}));
            assertThat(result4, equals({value: 2, done: false}));
            assertThat(sourceCallCount, equals(2));

            // Both advance again
            const [result5, result6] = await Promise.all([iter1.next(), iter2.next()]);

            assertThat(result5, equals({value: undefined, done: true}));
            assertThat(result6, equals({value: undefined, done: true}));
            assertThat(sourceCallCount, equals(2));
        });

        test("consumers can advance at different times but source waits", async () => {
            const shared = new SharedAsyncIterable(numbers(1, 2, 3), Backpressure.slowest);
            const iter1 = shared[Symbol.asyncIterator]();
            const iter2 = shared[Symbol.asyncIterator]();

            // iter1 calls next first
            const promise1 = iter1.next();

            // Give it a moment to potentially resolve (it shouldn't)
            await new Promise(resolve => setTimeout(resolve, 10));

            // iter2 calls next - now both should resolve
            const promise2 = iter2.next();

            const [result1, result2] = await Promise.all([promise1, promise2]);

            assertThat(result1, equals({value: 1, done: false}));
            assertThat(result2, equals({value: 1, done: false}));
        });

        test("when all consumers finish, new consumer gets fresh iterator", async () => {
            let iteratorCount = 0;
            const shared = new SharedAsyncIterable({
                async* [Symbol.asyncIterator](): AsyncIterator<number> {
                    iteratorCount++;
                    yield* [1, 2, 3];
                }
            }, Backpressure.slowest);

            // First consumer
            const first = await toPromiseArray(shared);
            assertThat(first, equals([1, 2, 3]));

            // Second consumer should get fresh iterator
            const second = await toPromiseArray(shared);
            assertThat(second, equals([1, 2, 3]));
        });

        test("three consumers all synchronized", async () => {
            const shared = new SharedAsyncIterable(numbers(1, 2), Backpressure.slowest);
            const iter1 = shared[Symbol.asyncIterator]();
            const iter2 = shared[Symbol.asyncIterator]();
            const iter3 = shared[Symbol.asyncIterator]();

            const [r1, r2, r3] = await Promise.all([
                iter1.next(),
                iter2.next(),
                iter3.next()
            ]);

            assertThat(r1, equals({value: 1, done: false}));
            assertThat(r2, equals({value: 1, done: false}));
            assertThat(r3, equals({value: 1, done: false}));
        });

        test("done state propagates to all consumers", async () => {
            const shared = new SharedAsyncIterable(numbers(1), Backpressure.slowest);
            const iter1 = shared[Symbol.asyncIterator]();
            const iter2 = shared[Symbol.asyncIterator]();

            // Consume the single value
            await Promise.all([iter1.next(), iter2.next()]);

            // Both should get done
            const [done1, done2] = await Promise.all([iter1.next(), iter2.next()]);

            assertThat(done1, equals({done: true, value: undefined}));
            assertThat(done2, equals({done: true, value: undefined}));
        });

        test("consumer joining after source completes gets done immediately", async () => {
            const shared = new SharedAsyncIterable(numbers(1), Backpressure.slowest);
            const iter1 = shared[Symbol.asyncIterator]();

            // Consume until done
            await iter1.next(); // value: 1
            await iter1.next(); // done: true

            // New consumer should get done immediately
            const iter2 = shared[Symbol.asyncIterator]();
            assertThat(await iter2.next(), equals({done: true, value: undefined}));
        });
    });

    describe("Backpressure.fastest", () => {
        test("single consumer works normally", async () => {
            const shared = new SharedAsyncIterable(numbers(1, 2, 3), Backpressure.fastest);
            const iter = shared[Symbol.asyncIterator]();

            assertThat(await iter.next(), equals({value: 1, done: false}));
            assertThat(await iter.next(), equals({value: 2, done: false}));
            assertThat(await iter.next(), equals({value: 3, done: false}));
            assertThat(await iter.next(), equals({done: true, value: undefined}));
        });

        test("fast consumer advances source without waiting for slow consumer", async () => {
            let sourceCallCount = 0;

            async function* counted() {
                for (const v of [1, 2, 3]) {
                    sourceCallCount++;
                    yield v;
                }
            }

            const shared = new SharedAsyncIterable(counted(), Backpressure.fastest);
            const iter1 = shared[Symbol.asyncIterator]();
            const iter2 = shared[Symbol.asyncIterator]();

            // iter1 calls next - should advance immediately without waiting for iter2
            const result1 = await iter1.next();
            assertThat(result1, equals({value: 1, done: false}));
            assertThat(sourceCallCount, equals(1));

            // iter1 advances again - still doesn't wait for iter2
            const result2 = await iter1.next();
            assertThat(result2, equals({value: 2, done: false}));
            assertThat(sourceCallCount, equals(2));

            // Now iter2 calls next - it gets the latest cached value (2)
            const result3 = await iter2.next();
            assertThat(result3, equals({value: 2, done: false}));
            assertThat(sourceCallCount, equals(2)); // Source hasn't advanced yet
        });

        test("slow consumer gets latest cached value", async () => {
            const shared = new SharedAsyncIterable(numbers(1, 2, 3, 4), Backpressure.fastest);
            const fast = shared[Symbol.asyncIterator]();
            const slow = shared[Symbol.asyncIterator]();

            // Fast consumer gets first three values (slow gets them cached, latest overwrites previous)
            assertThat(await fast.next(), equals({value: 1, done: false}));
            assertThat(await fast.next(), equals({value: 2, done: false}));
            assertThat(await fast.next(), equals({value: 3, done: false}));

            // Slow consumer finally calls next - gets latest cached value (3)
            assertThat(await slow.next(), equals({value: 3, done: false}));

            // Both advance together now
            const [r1, r2] = await Promise.all([fast.next(), slow.next()]);
            assertThat(r1, equals({value: 4, done: false}));
            assertThat(r2, equals({value: 4, done: false}));
        });

        test("multiple consumers calling next simultaneously may trigger multiple advances", async () => {
            let sourceCallCount = 0;

            async function* counted() {
                for (const v of [1, 2, 3]) {
                    sourceCallCount++;
                    yield v;
                }
            }

            const shared = new SharedAsyncIterable(counted(), Backpressure.fastest);
            const iter1 = shared[Symbol.asyncIterator]();
            const iter2 = shared[Symbol.asyncIterator]();

            // Both call next simultaneously - each may trigger sendNext()
            const [result1, result2] = await Promise.all([iter1.next(), iter2.next()]);

            // Both should get values (possibly different due to race condition)
            assertThat(result1.done, equals(false));
            assertThat(result2.done, equals(false));
        });

        test("multiple consumers at same pace all get same values", async () => {
            const shared = new SharedAsyncIterable(numbers(1, 2), Backpressure.fastest);
            const iter1 = shared[Symbol.asyncIterator]();
            const iter2 = shared[Symbol.asyncIterator]();

            // Both advance together - first value
            const [r1, r2] = await Promise.all([iter1.next(), iter2.next()]);
            assertThat(r1, equals({value: 1, done: false}));
            assertThat(r2, equals({value: 1, done: false}));

            // Both advance together - second value
            const [r3, r4] = await Promise.all([iter1.next(), iter2.next()]);
            assertThat(r3, equals({value: 2, done: false}));
            assertThat(r4, equals({value: 2, done: false}));
        });

        test("three consumers with different paces", async () => {
            const shared = new SharedAsyncIterable(numbers(1, 2, 3, 4, 5), Backpressure.fastest);
            const fastest = shared[Symbol.asyncIterator]();
            const medium = shared[Symbol.asyncIterator]();
            const slowest = shared[Symbol.asyncIterator]();

            // Fastest gets 1, 2, 3 (others cache 3 as latest)
            assertThat(await fastest.next(), equals({value: 1, done: false}));
            assertThat(await fastest.next(), equals({value: 2, done: false}));
            assertThat(await fastest.next(), equals({value: 3, done: false}));

            // Medium gets cached latest (3)
            assertThat(await medium.next(), equals({value: 3, done: false}));

            // Fastest advances to 4, slowest caches 4
            assertThat(await fastest.next(), equals({value: 4, done: false}));

            // Slowest gets cached latest (4)
            assertThat(await slowest.next(), equals({value: 4, done: false}));

            // Medium and slowest still have cached values
            // Fastest and slowest advance, but medium gets cached 4
            const [r1, r2, r3] = await Promise.all([
                fastest.next(),
                medium.next(),
                slowest.next()
            ]);
            assertThat(r1, equals({value: 5, done: false}));
            assertThat(r2, equals({value: 4, done: false})); // Gets cached value from step 5
            assertThat(r3, equals({value: 5, done: false}));
        });

        test("done state propagates to all consumers", async () => {
            const shared = new SharedAsyncIterable(numbers(1), Backpressure.fastest);
            const iter1 = shared[Symbol.asyncIterator]();
            const iter2 = shared[Symbol.asyncIterator]();

            // iter1 consumes the value
            assertThat(await iter1.next(), equals({value: 1, done: false}));

            // iter1 gets done
            assertThat(await iter1.next(), equals({done: true, value: undefined}));

            // iter2 should also get done
            assertThat(await iter2.next(), equals({done: true, value: undefined}));
        });

        test("late joiner gets fresh iterator after completion", async () => {
            let iteratorCount = 0;
            const shared = new SharedAsyncIterable({
                async* [Symbol.asyncIterator](): AsyncIterator<number> {
                    iteratorCount++;
                    yield* [1, 2, 3];
                }
            }, Backpressure.fastest);

            // First consumer
            const first = await toPromiseArray(shared);
            assertThat(first, equals([1, 2, 3]));
            assertThat(iteratorCount, equals(1));

            // Second consumer should get fresh iterator
            const second = await toPromiseArray(shared);
            assertThat(second, equals([1, 2, 3]));
            assertThat(iteratorCount, equals(2));
        });
    });
});
