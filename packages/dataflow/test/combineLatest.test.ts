import {describe, test} from "bun:test";
import {combineLatest} from "../src/combineLatest.ts";
import {toPromiseArray} from "@bodar/totallylazy/collections/Array.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";

async function* numbers(...values: number[]) {
    for (const v of values) yield v;
}

async function* letters(...values: string[]) {
    for (const v of values) yield v;
}

describe("combineLatest", () => {
    test("waits for all sources to emit before producing first value", async () => {
        async function* delayed() {
            await new Promise(resolve => setTimeout(resolve, 10));
            yield 1;
        }

        const result = await toPromiseArray(combineLatest([numbers(1), delayed()]));
        assertThat(result.length > 0, equals(true));
        assertThat(result[0], equals([1, 1]));
    });

    test("emits latest values from all sources", async () => {
        const result = await toPromiseArray(
            combineLatest([numbers(1, 2), letters('a', 'b')])
        );

        assertThat(result, equals([
            [1, 'a'],
            [2, 'a'],
            [2, 'b']
        ]));
    });

    test("emits when any source emits", async () => {
        const result = await toPromiseArray(
            combineLatest([numbers(1, 2, 3), letters('a')])
        );

        assertThat(result, equals([
            [1, 'a'],
            [2, 'a'],
            [3, 'a']
        ]));
    });

    test("keeps last value from completed source", async () => {
        const result = await toPromiseArray(
            combineLatest([numbers(1), letters('a', 'b', 'c')])
        );

        assertThat(result, equals([
            [1, 'a'],
            [1, 'b'],
            [1, 'c']
        ]));
    });

    test("completes when all sources complete", async () => {
        const result = await toPromiseArray(
            combineLatest([numbers(1, 2), letters('a', 'b')])
        );

        assertThat(result.length, equals(3));
    });

    test("works with three sources", async () => {
        async function* booleans(...values: boolean[]) {
            for (const v of values) yield v;
        }

        const result = await toPromiseArray(
            combineLatest([numbers(1, 2), letters('a'), booleans(true, false)])
        );

        assertThat(result, equals([
            [1, 'a', true],
            [2, 'a', true],
            [2, 'a', false]
        ]));
    });

    test("works with single source", async () => {
        const result = await toPromiseArray(
            combineLatest([numbers(1, 2, 3)])
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

        // Should see all fast emissions with 'a', then one with 'b'
        assertThat(result[0], equals([1, 'a']));
        assertThat(result[1], equals([2, 'a']));
        assertThat(result[2], equals([3, 'a']));
        assertThat(result[3], equals([3, 'b']));
    });
});
