import {describe, test} from "bun:test";
import {SharedAsyncIterable} from "../src/SharedAsyncIterable.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {toPromiseArray} from "@bodar/totallylazy/collections/Array.ts";

async function* numbers(...values: number[]) {
    for (const v of values) yield v;
}

describe("SharedAsyncIterator", () => {
    test("single consumer works normally", async () => {
        const shared = new SharedAsyncIterable(numbers(1, 2, 3));
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

        const shared = new SharedAsyncIterable(counted());
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
        const shared = new SharedAsyncIterable(numbers(1, 2, 3));
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
        });

        // First consumer
        const first = await toPromiseArray(shared);
        assertThat(first, equals([1,2,3]));

        // Second consumer should get fresh iterator
        const second = await toPromiseArray(shared);
        assertThat(second, equals([1,2,3]));
    });

    test("three consumers all synchronized", async () => {
        const shared = new SharedAsyncIterable(numbers(1, 2));
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
        const shared = new SharedAsyncIterable(numbers(1));
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
        const shared = new SharedAsyncIterable(numbers(1));
        const iter1 = shared[Symbol.asyncIterator]();

        // Consume until done
        await iter1.next(); // value: 1
        await iter1.next(); // done: true

        // New consumer should get done immediately
        const iter2 = shared[Symbol.asyncIterator]();
        assertThat(await iter2.next(), equals({done: true, value: undefined}));
    });
});
