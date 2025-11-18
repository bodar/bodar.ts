import {describe, test} from "bun:test";
import {Mutation} from "../src/Mutation.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";

describe("Mutation", () => {
    test("initial value", () => {
        const mut = new Mutation(42);
        assertThat(mut.value, equals(42));
    });

    test("setter updates value", () => {
        const mut = new Mutation(1);
        mut.value = 2;
        assertThat(mut.value, equals(2));
    });

    test("dispatches change event", async () => {
        const mut = new Mutation(0);
        const events: CustomEvent[] = [];
        mut.addEventListener('change', (e) => events.push(e as CustomEvent));

        mut.value = 10;
        assertThat(events.length, equals(1));
        assertThat(events[0].detail.value, equals(10));

        mut.value = 20;
        assertThat(events.length, equals(2));
        assertThat(events[1].detail.value, equals(20));
    });

    test("async iterator yields on change", async () => {
        const mut = new Mutation(0);
        const iter = mut[Symbol.asyncIterator]();

        assertThat((await iter.next()).value, equals(0));
        mut.value =  1;
        assertThat((await iter.next()).value, equals(1));
        mut.value =  2;
        assertThat((await iter.next()).value, equals(2));
    });
});

