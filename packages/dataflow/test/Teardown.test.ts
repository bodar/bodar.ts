import {describe, expect, test} from "bun:test";
import {parseHTML} from "linkedom";
import {BaseGraph} from "../src/BaseGraph.ts";
import {Backpressure} from "../src/SharedAsyncIterable.ts";
import {Throttle} from "../src/Throttle.ts";
import {Invalidator} from "../src/Invalidator.ts";
import {events} from "../src/api/events.ts";
import {renderAndExecute} from "../src/testing/renderAndExecute.ts";

const graph = (globals: any = globalThis) => new BaseGraph(Backpressure.fastest, Throttle.microTasks(), new Invalidator(), globals);
const settle = () => new Promise(resolve => setTimeout(resolve, 5));

describe("disposing a graph", () => {
    test("disposes every node's current value, once", async () => {
        const g = graph();
        let disposed = 0;
        g.set('resource', [], () => ({[Symbol.dispose]() { disposed++; }}));
        g.set('user', ['resource'], () => 'using it');
        g.run();
        await settle();
        await g[Symbol.asyncDispose]();
        expect(disposed).toBe(1);
        await g[Symbol.asyncDispose]();
        expect(disposed).toBe(1);
    });

    test("stops the graph: an event source's listener is removed", async () => {
        const g = graph();
        const target = new EventTarget();
        let runs = 0;
        g.set('clicks', [], () => events(target, 'x', (e: Event) => e));
        g.set('counted', ['clicks'], () => ++runs);
        g.run();
        await settle();
        target.dispatchEvent(new Event('x'));
        await settle();
        expect(runs).toBe(1);
        await g[Symbol.asyncDispose]();
        target.dispatchEvent(new Event('x'));
        await settle();
        expect(runs).toBe(1);
    });

    test("leaves the host's globals alone", async () => {
        let disposed = false;
        const g = graph({host: {[Symbol.dispose]() { disposed = true; }}});
        g.set('user', ['host'], (host: unknown) => typeof host);
        g.run();
        await settle();
        await g[Symbol.asyncDispose]();
        expect(disposed).toBe(false);
    });
});

describe("disposing a page", () => {
    test("renderAndExecute's page disposes its blocks' values", async () => {
        const html = `<html><body><script type="module" is="reactive">
            const resource = {[Symbol.dispose]() { document.body.dataset.disposed = 'yes'; }};
        </script></body></html>`;
        const page = await renderAndExecute(parseHTML as any, html);
        await page.idle.fired();
        expect(page.browser.document.body.dataset.disposed).toBe(undefined);
        await page[Symbol.asyncDispose]();
        expect(page.browser.document.body.dataset.disposed).toBe('yes');
    });
});
