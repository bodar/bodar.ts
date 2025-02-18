import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat";
import {view} from "@bodar/totallylazy/parsers/View";
import {is} from "@bodar/totallylazy/predicates/IsPredicate";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate";
import {string} from "@bodar/totallylazy/parsers/StringParser";
import {pair, triple} from "@bodar/totallylazy/parsers/TupleParser";
import {pattern} from "@bodar/totallylazy/parsers/PatternParser";
import {map} from "@bodar/totallylazy/transducers/MapTransducer";
import {parser} from "@bodar/totallylazy/parsers/Parser";

describe("TupleParser", () => {
    it("compose parsers into pairs", () => {
        const result = pair(string('AAA'), string('BBB')).parse(view('AAABBBCCC'));
        assertThat(result.value, equals(['AAA', 'BBB']));
        assertThat(result.remainder.toSource(), is('CCC'));
    });

    it("compose parsers into triples", () => {
        const integer = parser(pattern(/\d+/), map(Number));
        const result = triple(integer, string('AAA'), string('BBB'))
            .parse(view('123AAABBBCCC'));
        assertThat(result.value, equals([123, 'AAA', 'BBB']));
        assertThat(result.remainder.toSource(), is('CCC'));
    });
});
