import {curry, parametersOf} from "../../src/functions/curry.ts";
import {describe, it} from "bun:test";
import {assertThat} from "../../src/asserts/assertThat.ts";
import {is} from "../../src/predicates/IsPredicate.ts";
import {equals} from "../../src/predicates/EqualsPredicate.ts";

function add(a: number, b: number) {
    return a + b;
}

describe("curry", () => {
    it("a curried function is still a function", () => {
        assertThat(typeof curry(add), is('function'));
    });

    it("a curried function name is still correct", () => {
        assertThat(curry(add).name, is('add'));
    });

    it("once curried if all arguments are applied, just call the function", () => {
        assertThat(curry(add)(1, 2), is(3));
    });

    it("once curried can apply an argument", () => {
        const partial = curry(add)(1);
        assertThat(partial(2), is(3));
    });

    it("once applied previous arguments are captured", () => {
        assertThat(curry(add)(1).a, is(1));
    });

    it("once applied it's still a named function", () => {
        const applied = curry(add)(1);
        assertThat(typeof applied, is('function'));
        assertThat(applied.name, is('add'));
    });

});

describe("parametersOf", () => {
    it("can extract the parameters of a named function", () => {
        assertThat(parametersOf((a: any, b: any) => a + b), equals(['a', 'b']));
    });
});
