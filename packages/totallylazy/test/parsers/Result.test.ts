import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {view} from "@bodar/totallylazy/parsers/View.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {success} from "@bodar/totallylazy/parsers/Success.ts";
import {map} from "@bodar/totallylazy/transducers/MapTransducer.ts";
import {result} from "@bodar/totallylazy/parsers/Result.ts";
import {flatMap} from "@bodar/totallylazy/transducers/FlatMapTransducer.ts";
import {string} from "@bodar/totallylazy/parsers/StringParser.ts";

describe("Result", () => {
    it("can map", () => {
        const r = result(success('1', view('23')), map(Number));
        assertThat(r.value, is(1));
        assertThat(r.remainder.toSource(), is('23'));
    });

    it("can flatMap", () => {
        const anotherParser = string('1');
        const r = result(success('1', view('23')), flatMap(n => anotherParser.parse(view(n))));
        assertThat(r.value, is('1'));
        assertThat(r.remainder.toSource(), is('23'));
    });
});