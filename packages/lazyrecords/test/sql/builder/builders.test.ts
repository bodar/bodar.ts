import {describe, it} from "bun:test";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {definition, toSelect} from "../../../src/sql/builder/builders.ts";
import {sql} from "@bodar/lazyrecords/sql/template/Sql.ts";
import {accept, filter, reject} from "@bodar/totallylazy/transducers/FilterTransducer.ts";
import {where} from "@bodar/totallylazy/predicates/WherePredicate.ts";
import {property} from "@bodar/totallylazy/functions/Property.ts";
import {map} from "@bodar/totallylazy/transducers/MapTransducer.ts";
import {select} from "@bodar/totallylazy/functions/Select.ts";
import {and} from "@bodar/totallylazy/predicates/AndPredicate.ts";
import {or} from "@bodar/totallylazy/predicates/OrPredicate.ts";
import {not} from "@bodar/totallylazy/predicates/NotPredicate.ts";
import {between} from "@bodar/totallylazy/predicates/BetweenPredicate.ts";


interface Country {
    country_code: string;
    country_name: string;
    optional?: string;
    age: number;
}

const country = definition<Country>("country");
const countryCode = property<Country, 'country_code'>("country_code");
const countryName = property<Country, 'country_name'>("country_name");
const optional = property<Country, 'optional'>("optional");
const age = property<Country, 'age'>("age");

describe("selectExpression", () => {
    it("works with just the definition", () => {
        assertThat(sql(toSelect(country)).toString(),
            is('select all * from "country"'));
    });

    it("can filter with where", () => {
        assertThat(sql(toSelect(country, filter(where(countryCode, is("GB"))))).toString(),
            is(`select all * from "country" where "country_code" = 'GB'`));
    });

    it("can map with select", () => {
        assertThat(sql(toSelect(country, map(select(countryCode)))).toString(),
            is(`select all "country_code" from "country"`));
    });

    it("can combine", () => {
        assertThat(sql(toSelect(country, filter(where(countryCode, is("GB"))), map(select(countryCode)))).toString(),
            is(`select all "country_code" from "country" where "country_code" = 'GB'`));
    });

    it("supports 'and' predicates", () => {
        assertThat(sql(toSelect(country, filter(and(where(countryCode, is("GB")), where(countryName, is("United Kingdom")))))).toString(),
            is(`select all * from "country" where ("country_code" = 'GB' and "country_name" = 'United Kingdom')`));
    });

    it("supports 'or' predicates", () => {
        assertThat(sql(toSelect(country, filter(or(where(countryCode, is("GB")), where(countryName, is("United Kingdom")))))).toString(),
            is(`select all * from "country" where ("country_code" = 'GB' or "country_name" = 'United Kingdom')`));
    });

    it("'and' can be also just be written with multiple filters", () => {
        assertThat(sql(toSelect(country, filter(where(countryCode, is("GB"))), filter(where(countryName, is("United Kingdom"))))).toString(),
            is(`select all * from "country" where ("country_code" = 'GB' and "country_name" = 'United Kingdom')`));
    });

    it("can also write 'and' in infix style", () => {
        assertThat(sql(toSelect(country, filter(where(countryCode, is("GB")).and(where(countryName, is("United Kingdom")))))).toString(),
            is(`select all * from "country" where ("country_code" = 'GB' and "country_name" = 'United Kingdom')`));
    });

    it("can also write 'or' in infix style", () => {
        assertThat(sql(toSelect(country, filter(where(countryCode, is("GB")).or(where(countryName, is("United Kingdom")))))).toString(),
            is(`select all * from "country" where ("country_code" = 'GB' or "country_name" = 'United Kingdom')`));
    });

    it("correctly handles null values", () => {
        assertThat(sql(toSelect(country, filter(where(optional, is<string|undefined|null>(null))))).toString(),
            is(`select all * from "country" where "optional" is null`));
    });

    it("correctly transforms undefined values", () => {
        assertThat(sql(toSelect(country, filter(where(optional, is<string|undefined>(undefined))))).toString(),
            is(`select all * from "country" where "optional" is null`));
    });

    it("can negate a predicate inside the where", () => {
        assertThat(sql(toSelect(country, filter(where(countryCode, not(is("GB")))))).toString(),
            is(`select all * from "country" where not ( "country_code" = 'GB' )`));
    });

    it("can negate a predicate outside the where", () => {
        assertThat(sql(toSelect(country, filter(not(where(countryCode, is("GB")))))).toString(),
            is(`select all * from "country" where not ( "country_code" = 'GB' )`));
    });

    it("also works with accept", () => {
        assertThat(sql(toSelect(country, accept(where(countryCode, is("GB"))))).toString(),
            is(`select all * from "country" where "country_code" = 'GB'`));
    });

    it("also works with reject", () => {
        assertThat(sql(toSelect(country, reject(where(countryCode, is("GB"))))).toString(),
            is(`select all * from "country" where not ( "country_code" = 'GB' )`));
    });

    it("supports between", () => {
        assertThat(sql(toSelect(country, filter(where(age, between(18, 21))))).toString(),
            is(`select all * from "country" where "age" between 18 and 21`));
    });
});