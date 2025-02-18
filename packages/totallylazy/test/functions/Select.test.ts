import {describe, it} from "bun:test";
import {property} from "@bodar/totallylazy/functions/Property";
import type {Property} from "@bodar/totallylazy/functions/Property";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat";
import {is} from "@bodar/totallylazy/predicates/IsPredicate";
import {select} from "@bodar/totallylazy/functions/Select";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate";

describe("Select", () => {
    interface Car {
        make: string;
        model: string;
        colour: string;
    }

    const car: Car = {make: 'Ford', model: 'Fiesta', colour: 'Red'};

    const properties: Property<Car, keyof Car>[] = [property('make'), property('colour')];
    const selection = select(...properties);

    it("can be used as a function", () => {
        assertThat(selection(car), equals({make: 'Ford', colour: 'Red'}));
    });

    it("can also be created from property keys", () => {
        assertThat(select('make', 'colour')(car), equals({make: 'Ford', colour: 'Red'}));
    });

    it("is inspectable", () => {
        assertThat(selection.properties, equals(properties));
    });

    it("is self describing", () => {
        assertThat(selection.toString(), is(`select(property('make'), property('colour'))`));
    });
});