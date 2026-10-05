import {describe, expect, spyOn, test} from "bun:test";
import {parseHTML} from "linkedom";
import {BaseGraph} from "../src/BaseGraph.ts";
import {Backpressure} from "../src/SharedAsyncIterable.ts";
import {Throttle} from "../src/Throttle.ts";
import {Invalidator} from "../src/Invalidator.ts";
import {renderAndExecute} from "../src/testing/renderAndExecute.ts";
import {toPromiseArray} from "@bodar/totallylazy/collections/Array.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";

async function* ticks(...values: number[]) {
    for (const value of values) {
        yield value;
        await new Promise(resolve => setTimeout(resolve, 5));
    }
}

describe("a block that fails", () => {
    function graph(errors: string[][]) {
        return new BaseGraph(Backpressure.slowest, Throttle.microTasks(), new Invalidator(), globalThis,
            (key: string, error: any) => errors.push([key, error.message]));
    }

    test("throwing skips that input, is reported, and the block runs again on the next one", async () => {
        const errors: string[][] = [];
        const g = graph(errors);
        g.set('a', [], () => ticks(1, 2, 3));
        g.set('b', ['a'], (a: number) => {
            if (a === 2) throw new Error('two');
            return a * 10;
        });
        const c = g.set('c', ['b'], (b: number) => b + 1);
        assertThat(await toPromiseArray(c), equals([11, 31]));
        assertThat(errors, equals([['b', 'two']]));
    });

    test("a rejected promise is reported the same way", async () => {
        const errors: string[][] = [];
        const g = graph(errors);
        g.set('a', [], () => ticks(1, 2, 3));
        const b = g.set('b', ['a'], async (a: number) => {
            if (a === 2) throw new Error('two');
            return a * 10;
        });
        assertThat(await toPromiseArray(b), equals([10, 30]));
        assertThat(errors, equals([['b', 'two']]));
    });

    test("a run superseded by newer input is not reported when it fails later", async () => {
        const errors: string[][] = [];
        const g = new BaseGraph(Backpressure.fastest, Throttle.microTasks(), new Invalidator(), globalThis,
            (key: string, error: any) => errors.push([key, error.message]));
        g.set('a', [], () => ticks(1, 2));
        const b = g.set('b', ['a'], async (a: number) => {
            if (a === 1) await new Promise((_, reject) => setTimeout(() => reject(new Error('stale')), 20));
            return a * 10;
        });
        assertThat(await toPromiseArray(b), equals([20]));
        await new Promise(resolve => setTimeout(resolve, 30));
        assertThat(errors, equals([]));
    });

    test("a generator keeps what it yielded before it threw", async () => {
        const errors: string[][] = [];
        const g = graph(errors);
        g.set('a', [], () => ticks(1, 2));
        const b = g.set('b', ['a'], function* (a: number) {
            yield a * 10;
            if (a === 1) throw new Error('one');
            yield a * 10 + 1;
        });
        assertThat(await toPromiseArray(b), equals([10, 20, 21]));
        assertThat(errors, equals([['b', 'one']]));
    });

    test("a join past the failed block catches up on the next good value", async () => {
        // The runtime's backpressure: under slowest, a node that yields nothing for an input stalls a join past it (failure or not)
        const g = new BaseGraph(Backpressure.fastest, Throttle.microTasks(), new Invalidator(), globalThis, () => {});
        g.set('a', [], () => ticks(1, 2, 3));
        g.set('b', ['a'], (a: number) => {
            if (a === 2) throw new Error('two');
            return a * 10;
        });
        const d = g.set('d', ['a', 'b'], (a: number, b: number) => `${a}/${b}`);
        assertThat(await toPromiseArray(d), equals(['1/10', '3/30']));
    });
});

describe("a failing block in a page", () => {
    test("shows the error in its slot, dispatches it from the root, and recovers on the next good run", async () => {
        const logged = spyOn(console, 'error').mockImplementation(() => {});
        try {
            const html = `<html><body>
<script type="module" is="reactive">const state = mutable(0); document.body.set = v => state.value = v;</script>
<script type="module" is="reactive"><p>{state === 1 ? (() => { throw new Error('bad state'); })() : state}</p></script>
</body></html>`;
            const {browser, idle} = await renderAndExecute(parseHTML as any, html);
            await idle.fired();
            const document = browser.document as any;
            const events: any[] = [];
            document.addEventListener('dataflow-error', (e: any) => events.push(e.detail));
            const set = async (v: number) => {
                document.body.set(v);
                await new Promise(r => setTimeout(r, 20));
            };

            await set(1);
            expect(document.querySelector('p') === null).toBe(true);
            expect(document.querySelector('slot').textContent).toBe('Error: bad state');
            expect(events.length).toBe(1);
            expect(events[0].error.message).toBe('bad state');
            expect(logged).toHaveBeenCalled();

            await set(2);
            expect(document.querySelector('p').textContent).toBe('2');
            expect(document.querySelector('slot').textContent).toBe('2');
        } finally {
            logged.mockRestore();
        }
    });
});
