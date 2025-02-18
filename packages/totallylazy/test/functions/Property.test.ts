import {describe, it} from "bun:test";
import {isProperty, property} from "@bodar/totallylazy/functions/Property";
import type {Property} from "@bodar/totallylazy/functions/Property";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat";
import {is} from "@bodar/totallylazy/predicates/IsPredicate";

interface Car {
    make: string;
    model: string;
    colour: string;
}

const car: Car = {make: 'Ford', model: 'Fiesta', colour: 'Red'};

const colour: Property<Car, 'colour'> = property('colour');

describe("Property", () => {
    it("can be used as a function", () => {
        assertThat(colour(car), is('Red'));
    });

    it("is inspectable", () => {
        assertThat(colour.key, is('colour'));
    });

    it("has function name", () => {
        assertThat(colour.name, is('property'));
    });

    it("is self describing", () => {
        assertThat(colour.toString(), is(`property('colour')`));
    });
});

describe("isProperty", () => {
    it("works", () => {
        assertThat(isProperty(colour), is(true));
        assertThat(isProperty(() => 'false'), is(false));
    });
});