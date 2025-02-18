import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {Compound} from "@bodar/lazyrecords/sql/template/Compound.ts";
import {text} from "@bodar/lazyrecords/sql/template/Text.ts";

describe('Compound', () => {
    const a = text('a');
    const b = text('b');
    const c = text('c');
    const separator = text(', ');

    it('correctly inserts the separator where needed', () => {
        assertThat(Array.from(new Compound([], separator)), equals([]));
        assertThat(Array.from(new Compound([a], separator)), equals([a]));
        assertThat(Array.from(new Compound([a, b], separator)), equals([a, separator, b]));
        assertThat(Array.from(new Compound([a, b, c], separator)), equals([a, separator, b, separator, c]));
    });

    it('can also add start and end', () => {
        const start = text('(');
        const end = text(')');
        assertThat(Array.from(new Compound([a, b, c], separator, start, end)), equals([start, a, separator, b, separator, c, end]));
    });
});