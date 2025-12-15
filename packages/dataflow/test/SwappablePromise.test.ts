import {describe, test} from "bun:test";
import {SwappablePromise} from "../src/SwappableAsyncIterable.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";

describe("SwappablePromise", () => {
    test("By default passes through any results", async () => {
        const result = await new SwappablePromise(Promise.resolve(1));
        assertThat(result, is(1))
    });

    test("can swap the promise before it is resolved", async () => {
        const promise = new SwappablePromise(Promise.resolve(1));
        promise.swap(Promise.resolve(2))
        const result = await promise;
        assertThat(result, is(2))
    });

    test("can still swap even if then has already been called", async () => {
        const promise = new SwappablePromise(Promise.resolve(1));
        const result = promise.then(v => v * 2);
        promise.swap(Promise.resolve(2))
        assertThat(await result, is(4))
    });
});