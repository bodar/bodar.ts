import {_, curry} from "../../src/functions/curry.ts";
import {describe, it} from "bun:test";
import {assertThat} from "../../src/asserts/assertThat.ts";
import {is} from "../../src/predicates/IsPredicate.ts";
import {equals} from "../../src/predicates/EqualsPredicate.ts";
import type {Mapper} from "../../src/functions/Mapper.ts";
import {isMapTransducer} from "../../src/transducers/MapTransducer.ts";

function add(a: number, b: number) {
    return a + b;
}

describe("curry", () => {
    it("a curried function is still a function", () => {
        assertThat(typeof curry(add), is('function'));
    });

    it("a curried function still has the correct name", () => {
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

    it("can keep applying more and more arguments", () => {
        const applied = curry((a: number, b: number, c: number, d: number) => a + b + c + d)(1)(2)(3);
        assertThat(typeof applied, is('function'));
        assertThat(applied(4), is(10));
        assertThat(applied.a, is(1));
        assertThat(applied.b, is(2));
        assertThat(applied.c, is(3));
    });

    it("if function has default parameter then it can be called with or with that parameter", () => {
        const curried = curry(function multiply(a: number, b = 2) {
            return a * b;
        });
        assertThat(curried(3), is(6));
        assertThat(curried(3, 3), is(9));
    });

    it("if functions arguments conflict with standard function properties or methods it will NOT override them", () => {
        const applied = curry(function weird(name: string, second: string) {
            return 'Hello' + name + second;
        })('Dan');
        assertThat(applied.name, is('weird'));
    });

    it("calling toString on a curried lambda will return the lambda", () => {
        const applied = curry((a: number, b: number) => a + b)(1);
        assertThat(applied.toString(), is('(a, b) => a + b'));
        // Potentially we could make this print "(b) => 1 + b" but is it worth it
    });

    it("calling toString on a named function will display the partially applied parameters", () => {
        const applied = curry(add)(1);
        assertThat(applied.toString(), is('add(1)'));
    });

    it("can use _ placeholder to apply later arguments", () => {
        const partial = curry((first:string, last:string) => 'Hello ' + first + ' ' + last)(_, 'Bodart');
        assertThat('first' in partial, is(false));
        assertThat(partial.last, is('Bodart'));
        assertThat(partial('Dan'), is('Hello Dan Bodart'));
    });
});

describe("curried map example test", () => {
    function* map<A, B>(mapper: Mapper<A, B>, iterable: Iterable<A>) {
        for (const a of iterable) {
            yield mapper(a);
        }
    }

    const transducer = curry(map)(String);

    it("can be created first then applied to an iterable", () => {
        assertThat(Array.from(transducer([1, 2, 3, 4, 5])), equals(['1', '2', '3', '4', '5']));
    });

    it("is inspectable",  () => {
        assertThat(transducer.mapper, is(String));
    });

    it("is self describing",  () => {
        assertThat(transducer.toString(), is(`map(${String})`));
    });

    it("isMapTransducer works",  () => {
        assertThat(isMapTransducer(transducer), is(true));
        assertThat(isMapTransducer(() => 'false'), is(false));
    });

})