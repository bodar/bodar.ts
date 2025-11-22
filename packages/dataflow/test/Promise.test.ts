import {describe, test} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {fulfilled, raceAll} from "../src/Promise.ts";

describe("Promises", () => {
    test("raceAll returns either the value or a Promise if it hasn't settled", async () => {
        const slow = new Promise(resolve => setTimeout(resolve, 1000));
        const result = await raceAll([Promise.resolve(1).then(String), slow, Promise.resolve(2).then(String)]);
        assertThat(result, equals(['1', '2']));
    });

    test("can detect if Promise is fulfilled", async () => {
        assertThat(await fulfilled(Promise.resolve(1)), is(true));
        assertThat(await fulfilled(new Promise(resolve => setTimeout(resolve, 10))), is(false));
    });
});