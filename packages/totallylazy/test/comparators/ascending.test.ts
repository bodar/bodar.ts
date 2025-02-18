import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat";
import {ascending} from "@bodar/totallylazy/comparators/ascending";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate";

describe("ascending", () => {
    it("follows the Java comparator contract", () => {
        assertThat(ascending(1, 2), equals(-1));
        assertThat(ascending(1, 1), equals(0));
        assertThat(ascending(2, 1), equals(1));
    });

    it("can sort an array", () => {
        const array = [3, 1, 2, 5, 4];
        assertThat(array.sort(ascending), equals([1, 2, 3, 4, 5]));
    });
});
