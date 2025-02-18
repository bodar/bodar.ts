import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate";
import {descending} from "@bodar/totallylazy/comparators/descending";

describe("descending", () => {
    it("follows the Java comparator contract", () => {
        assertThat(descending(1, 2), equals(1));
        assertThat(descending(1, 1), equals(0));
        assertThat(descending(2, 1), equals(-1));
    });

    it("can sort an array", () => {
        const array = [3, 1, 2, 5, 4];
        assertThat(array.sort(descending), equals([5, 4, 3, 2, 1]));
    });
});
