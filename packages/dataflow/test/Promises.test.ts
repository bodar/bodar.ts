import {describe, test} from "bun:test";
import {Promises} from "../src/Promises.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {isPromiseLike} from "../src/IsAsyncIterable.ts";

describe("Promises", () => {
    test("raceAll returns either the value or a Promise if it hasn't settled", async () => {
        const slow = new Promise(resolve => {
            setTimeout(resolve, 1000);
            return 3;
        });
        const result = await Promises.raceAll([Promise.resolve(1).then(String), slow, Promise.resolve(2).then(String)]);
        assertThat(result[0], is('1'));
        assertThat(isPromiseLike(result[1]), is(true));
        assertThat(result[2], is('2'));
    });
});