import {describe, test} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {isAsyncGeneratorFunction, isAsyncIterable, isGeneratorFunction, isIterator, isPromiseLike} from "../src/type-guards.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";

describe("type-guards", () => {
    test("can detect a generator function", async () => {
        assertThat(isGeneratorFunction(function* () {
        }), is(true))
        assertThat(isAsyncGeneratorFunction(function* () {
        }), is(false))
    });

    test("can detect an async generator function", async () => {
        assertThat(isAsyncGeneratorFunction(async function* () {
        }), is(true))
        assertThat(isGeneratorFunction(async function* () {
        }), is(false))
    });

    test("null is not an async iterable, iterator or promise", async () => {
        assertThat(isAsyncIterable(null), is(false));
        assertThat(isIterator(null), is(false));
        assertThat(isPromiseLike(null), is(false));
    });
});
