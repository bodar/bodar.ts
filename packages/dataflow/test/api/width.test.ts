import {describe, test} from "bun:test";
import {Width, type WidthDependencies} from "../../src/api/width.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {parseHTML} from "linkedom";

class ManualResizeObserver {
    callback: ResizeObserverCallback;
    target?: Element;
    disconnected = false;

    constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
    }

    observe(target: Element) {
        this.target = target;
    }

    unobserve() {
    }

    disconnect() {
        this.disconnected = true;
    }

    fire(width: number, height: number) {
        this.callback([{
            target: this.target!,
            contentRect: {width, height} as DOMRectReadOnly,
            borderBoxSize: [],
            contentBoxSize: [],
            devicePixelContentBoxSize: []
        } as ResizeObserverEntry], this);
    }
}

let currentObserver: ManualResizeObserver | undefined;

function setup(key: string = "test-key") {
    currentObserver = undefined;
    const globals = parseHTML(`<html><body><slot name="${key}" style="display: contents"></slot></body></html>`);
    const deps: WidthDependencies = {
        document: globals.document,
        window: {
            getComputedStyle: (el: Element) => (el as HTMLElement).style
        } as Window,
        ResizeObserver: class extends ManualResizeObserver {
            constructor(callback: ResizeObserverCallback) {
                super(callback);
                currentObserver = this;
            }
        } as unknown as typeof ResizeObserver
    };
    const widthIterable = Width.for(key, deps);
    return {document: globals.document, widthIterable};
}

describe("Width", () => {
    test("yields width when resize fires", async () => {
        const {widthIterable} = setup();
        const iterator = widthIterable[Symbol.asyncIterator]();

        // Start iteration - this triggers observer creation
        const nextPromise = iterator.next();

        // Now observer exists, fire it
        currentObserver!.fire(100, 50);

        const result = await nextPromise;
        assertThat(result.value, equals(100));
        assertThat(result.done, equals(false));
    });

    test("skips when width === 0", async () => {
        const {widthIterable} = setup();
        const iterator = widthIterable[Symbol.asyncIterator]();

        const nextPromise = iterator.next();

        currentObserver!.fire(0, 50);  // Should be skipped
        currentObserver!.fire(100, 50);  // This should be yielded

        const result = await nextPromise;
        assertThat(result.value, equals(100));
    });

    test("skips when width unchanged", async () => {
        const {widthIterable} = setup();
        const iterator = widthIterable[Symbol.asyncIterator]();

        const firstPromise = iterator.next();
        currentObserver!.fire(100, 50);
        const first = await firstPromise;
        assertThat(first.value, equals(100));

        const secondPromise = iterator.next();
        currentObserver!.fire(100, 100); // height changed but width same - skipped
        currentObserver!.fire(200, 100); // width changed - yielded
        const second = await secondPromise;
        assertThat(second.value, equals(200));
    });

    test("sets slot display to block if contents", async () => {
        const {document} = setup("test-key");
        const slot = document.querySelector('slot[name="test-key"]') as HTMLElement;
        assertThat(slot.style.display, is("block"));
    });

    test("throws if slot not found", async () => {
        const globals = parseHTML(`<html><body></body></html>`);
        const deps: WidthDependencies = {
            document: globals.document,
            window: {getComputedStyle: () => ({display: 'block'})} as unknown as Window,
            ResizeObserver: ManualResizeObserver as unknown as typeof ResizeObserver
        };

        let error: Error | undefined;
        try {
            Width.for("missing-key", deps);
        } catch (e) {
            error = e as Error;
        }

        assertThat(error?.message, is("Unable to find slot for missing-key"));
    });

    test("disconnects observer when iterator returns", async () => {
        const {widthIterable} = setup();
        const iterator = widthIterable[Symbol.asyncIterator]();

        const nextPromise = iterator.next();
        currentObserver!.fire(100, 50);
        await nextPromise;

        await iterator.return!(undefined);
        assertThat(currentObserver!.disconnected, equals(true));
    });
});
