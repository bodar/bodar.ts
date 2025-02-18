import {describe, it} from "bun:test";
import {isWherePredicate, where} from "@bodar/totallylazy/predicates/WherePredicate";
import type {Property} from "@bodar/totallylazy/functions/Property";
import {property} from "@bodar/totallylazy/functions/Property";
import {is} from "@bodar/totallylazy/predicates/IsPredicate";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate";
import {assertThat, assertTrue} from "@bodar/totallylazy/asserts/assertThat";
import {isNotPredicate, not} from "@bodar/totallylazy/predicates/NotPredicate";

interface Car {
    make: string;
    model: string;
    colour: string;
}

const cars: Car[] = [
    {make: 'Ford', model: 'Fiesta', colour: 'Red'},
    {make: 'Land Rover', model: 'Defender', colour: 'Muddy'},
];

const colour: Property<Car, 'colour'> = property('colour');

describe("WherePredicate", () => {
    it("can be used to filter objects", () => {
        assertThat(cars.filter(where(colour, is('Red'))).length, is(1));
    });

    it("is inspectable", () => {
        const predicate = where(colour, is('Red'));
        assertThat(predicate.mapper, is(colour));
        assertThat(predicate.predicate, equals(is('Red')));
    });

    it("is self describing", () => {
        const predicate = where(colour, is('Red'));
        assertThat(predicate.toString(), is(`where(property('colour'), is("Red"))`));
    });

    it("supports not", () => {
        const predicate = not(where(colour, is('Red')));
        assertTrue(isNotPredicate(predicate));
    });
});

describe("isWherePredicate", () => {
    it("works", () => {
        assertTrue(isWherePredicate(where(colour, is('Red'))));
    });
});