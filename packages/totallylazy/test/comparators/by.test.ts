import {describe, it} from "bun:test";
import {assertFalse, assertThat, assertTrue} from "@bodar/totallylazy/asserts/assertThat";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate";
import {by, isByComparator} from "@bodar/totallylazy/comparators/by";
import {descending} from "@bodar/totallylazy/comparators/descending";
import {property} from "@bodar/totallylazy/functions/Property";
import {is} from "@bodar/totallylazy/predicates/IsPredicate";

interface Car {
    make: string;
    model: string;
    colour: string;
}

const make = property<Car, 'make'>('make');

describe("by", () => {
    const cars: Car[] = [
        {make: 'Land Rover', model: 'Defender', colour: 'Muddy'},
        {make: 'Ford', model: 'Galaxy', colour: 'Red'},
        {make: 'Toyota', model: 'Prius', colour: 'Silver'},
    ];

    it("can work with a property", () => {
        assertThat(cars.sort(by(make, descending)).map(make), equals(["Toyota","Land Rover","Ford"]));
    });

    it("can work with a key", () => {
        assertThat(cars.sort(by('make', descending)).map(make), equals(["Toyota","Land Rover","Ford"]));
    });

    it("can work with a function", () => {
        assertThat(cars.sort(by(car => car.make, descending)).map(make), equals(["Toyota","Land Rover","Ford"]));
    });

    it("is inspectable", () => {
        const comparator = by<Car, 'make'>('make', descending);
        assertThat(comparator.mapper, equals(make));
        assertThat(comparator.comparator, equals(descending));
    });

    it("has function name", () => {
        const comparator = by<Car, 'make'>('make', descending);
        assertThat(comparator.name, is('by'));
    });

    it("is self describing", () => {
        const comparator = by<Car, 'make'>('make', descending);
        assertThat(comparator.toString(), is(`by(property('make'), ${descending})`));
    });
});

describe("isByComparator", () => {
    it("works", () => {
        assertTrue(isByComparator(by<Car, 'make'>('make')));
        assertTrue(isByComparator(by(make)));
        assertTrue(isByComparator(by((car: Car) => car.make)));
        assertFalse(isByComparator(() => 0));
    });
});