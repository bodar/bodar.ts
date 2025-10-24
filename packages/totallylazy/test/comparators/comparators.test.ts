import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {ascending} from "@bodar/totallylazy/comparators/ascending.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {comparators} from "@bodar/totallylazy/comparators/comparators.ts";
import {by} from "@bodar/totallylazy/comparators/by.ts";
import {descending} from "@bodar/totallylazy/comparators/descending.ts";

describe("comparators", () => {
    it("can compose multiple comparators to sort by more than 1 property", () => {
        interface Car {
            make: string;
            model: string;
            colour: string;
        }

        const cars: Car[] = [
            {make: 'Ford', model: 'Galaxy', colour: 'Red'},
            {make: 'Ford', model: 'Fiesta', colour: 'Red'},
            {make: 'Ford', model: 'Fiesta', colour: 'Blue'},
            {make: 'Land Rover', model: 'Defender', colour: 'Muddy'},
            {make: 'Land Rover', model: 'Defender', colour: 'Black'},
            {make: 'Land Rover', model: 'Discovery', colour: 'Black'},
            {make: 'Land Rover', model: 'Discovery', colour: 'Green'},
        ];

        assertThat(cars.sort(comparators(
            by('make', descending),
            by('model', ascending),
            by('colour', ascending),
        )), equals([
            {make: "Land Rover", model: "Defender", colour: "Black"},
            {make: "Land Rover", model: "Defender", colour: "Muddy"},
            {make: "Land Rover", model: "Discovery", colour: "Black"},
            {make: "Land Rover", model: "Discovery", colour: "Green"},
            {make: "Ford", model: "Fiesta", colour: "Blue"},
            {make: "Ford", model: "Fiesta", colour: "Red"},
            {make: "Ford", model: "Galaxy", colour: "Red"}
        ]));
    });

    it("works with one", () => {
        assertThat(comparators(ascending)(0, 0), equals(ascending(0, 0)));
        assertThat(comparators(ascending)(0, 1), equals(ascending(0, 1)));
        assertThat(comparators(ascending)(1, 1), equals(ascending(1, 1)));
        assertThat(comparators(ascending)(1, 0), equals(ascending(1, 0)));
    });

    it("does nothing with no arguments", () => {
        const numbers = [4,2,5,1,3];
        assertThat(numbers.sort(comparators()), equals(numbers));
    });
});
