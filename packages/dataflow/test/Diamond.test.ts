import {describe, test} from "bun:test";
import {BaseGraph} from "../src/BaseGraph.ts";
import {Backpressure} from "../src/SharedAsyncIterable.ts";
import {Throttle} from "../src/Throttle.ts";
import {Invalidator} from "../src/Invalidator.ts";
import {toPromiseArray} from "@bodar/totallylazy/collections/Array.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";

function graph() {
    return new BaseGraph(Backpressure.slowest, Throttle.microTasks(), new Invalidator());
}

async function* ticks(...values: number[]) {
    for (const value of values) {
        yield value;
        await new Promise(resolve => setTimeout(resolve, 5));
    }
}

describe("diamond shaped graphs", () => {
    test("paths of equal length never mix old and new values", async () => {
        const g = graph();
        g.set('a', [], () => ticks(1, 2, 3));
        g.set('b', ['a'], (a: number) => a * 10);
        g.set('c', ['a'], (a: number) => a * 100);
        const d = g.set('d', ['b', 'c'], (b: number, c: number) => `${b}/${c}`);
        assertThat(await toPromiseArray(d), equals(['10/100', '20/200', '30/300']));
    });

    test("paths of unequal length never mix old and new values", async () => {
        const g = graph();
        g.set('a', [], () => ticks(1, 2, 3));
        g.set('b', ['a'], (a: number) => a * 10);
        g.set('b2', ['b'], (b: number) => b);
        g.set('b3', ['b2'], (b: number) => b);
        g.set('c', ['a'], (a: number) => a * 100);
        const d = g.set('d', ['b3', 'c'], (b: number, c: number) => `${b}/${c}`);
        assertThat(await toPromiseArray(d), equals(['10/100', '20/200', '30/300']));
    });

    test("an async step on one path never mixes old and new values", async () => {
        const g = graph();
        g.set('a', [], () => ticks(1, 2, 3));
        g.set('b', ['a'], async (a: number) => {
            await new Promise(resolve => setTimeout(resolve, 1));
            return a * 10;
        });
        g.set('c', ['a'], (a: number) => a * 100);
        const d = g.set('d', ['b', 'c'], (b: number, c: number) => `${b}/${c}`);
        assertThat(await toPromiseArray(d), equals(['10/100', '20/200', '30/300']));
    });

    test("an input that does not share a source with the change is not waited for", async () => {
        const g = graph();
        g.set('a', [], () => ticks(1, 2, 3));
        g.set('x', [], () => 'x');
        g.set('b', ['a'], (a: number) => a * 10);
        g.set('b2', ['b'], (b: number) => b);
        g.set('c', ['a', 'x'], (a: number, x: string) => `${a * 100}${x}`);
        const d = g.set('d', ['b2', 'c'], (b: number, c: string) => `${b}/${c}`);
        assertThat(await toPromiseArray(d), equals(['10/100x', '20/200x', '30/300x']));
    });

    test("a node yielding many values per input stays consistent with its siblings", async () => {
        const g = graph();
        g.set('a', [], () => ticks(1, 2));
        g.set('b', ['a'], function* (a: number) {
            yield a * 10;
            yield a * 10 + 1;
        });
        g.set('c', ['a'], (a: number) => a * 100);
        g.set('c2', ['c'], (c: number) => c);
        const d = g.set('d', ['b', 'c2'], (b: number, c: number) => `${b}/${c}`);
        assertThat(await toPromiseArray(d), equals(['10/100', '11/100', '20/200', '21/200']));
    });
});
