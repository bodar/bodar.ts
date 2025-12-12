import {describe, test} from "bun:test";
import {parseHTML} from "linkedom";
import {type Renderer, Resize} from "../../src/api/resize.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";

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

function setup(render: Renderer) {
    const globals = parseHTML("...");
    const resize = new Resize({
        render,
        document: globals.document,
        HTMLElement: globals.HTMLElement,
        ResizeObserver: ManualResizeObserver
    });
    return {document: globals.document, resize, observer: (resize.observer as ManualResizeObserver)};
}

describe("Resize", () => {
    test("renders when width > 0", async () => {
        const {document, resize, observer} = setup((width) => {
            const span = document.createElement("span");
            span.textContent = `width: ${width}`;
            return span;
        });

        document.body.appendChild(resize.container);
        observer.fire(100, 50);

        await Promise.resolve();

        assertThat(resize.container.innerHTML, is("<span>width: 100</span>"));
    });

    test("skips render when width === 0", async () => {
        let renderCount = 0;
        const {observer} = setup((_width) => {
            renderCount++;
            return null;
        });

        observer.fire(0, 50);
        await Promise.resolve();

        assertThat(renderCount, equals(0));
    });

    test("clears content when render returns null", async () => {
        const {resize, observer, document} = setup((width) => {
            if (width < 50) return null;
            return document.createElement("span");
        });

        document.body.appendChild(resize.container);

        observer.fire(100, 50);
        await Promise.resolve();
        assertThat(resize.container.children.length, equals(1));

        observer.fire(30, 50);
        await Promise.resolve();
        assertThat(resize.container.children.length, equals(0));
    });

    test("disconnects on detachment after attachment", async () => {
        const {resize, observer, document} = setup((_width) => "test");

        document.body.appendChild(resize.container);
        observer.fire(100, 50);
        await Promise.resolve();

        resize.container.remove();
        observer.fire(0, 0);
        await Promise.resolve();

        assertThat(observer.disconnected, equals(true));
    });

    test("does not disconnect before first attachment", async () => {
        const {observer} = setup((_width) => "test");

        observer.fire(0, 0);
        await Promise.resolve();

        assertThat(observer.disconnected, equals(false));
    });

    test("ignores height-only changes when render only uses width", async () => {
        let renderCount = 0;
        const {resize, observer, document} = setup((width) => {
            renderCount++;
            return `width: ${width}`;
        });

        document.body.appendChild(resize.container);

        observer.fire(100, 50);
        await Promise.resolve();
        assertThat(renderCount, equals(1));

        observer.fire(100, 100);
        await Promise.resolve();
        assertThat(renderCount, equals(1));
    });

    test("responds to height changes when render uses height", async () => {
        let renderCount = 0;
        const {resize, observer, document} = setup((width, height) => {
            renderCount++;
            return `${width}x${height}`;
        });

        document.body.appendChild(resize.container);

        observer.fire(100, 50);
        await Promise.resolve();
        assertThat(renderCount, equals(1));

        observer.fire(100, 100);
        await Promise.resolve();
        assertThat(renderCount, equals(2));
    });

    test("sets absolute position on child when render uses height", async () => {
        const {resize, observer, document} = setup((_width, _height) => {
            return document.createElement("div");
        });

        document.body.appendChild(resize.container);

        observer.fire(100, 50);
        await Promise.resolve();

        const child = resize.container.firstChild as HTMLElement;
        assertThat(child.style.position, is("absolute"));
    });

    test("does not set absolute position when render only uses width", async () => {
        const {resize, observer, document} = setup((_width) => {
            return document.createElement("div");
        });

        document.body.appendChild(resize.container);

        observer.fire(100, 50);
        await Promise.resolve();

        const child = resize.container.firstChild as HTMLElement;
        assertThat(child.style.position, is(undefined));
    });

    test("ignores stale renders", async () => {
        let resolvers: Array<(value: string) => void> = [];
        const {resize, observer, document} = setup(async (_width) => {
            return new Promise<string>(resolve => resolvers.push(resolve));
        });

        document.body.appendChild(resize.container);

        observer.fire(100, 50);
        await Promise.resolve();
        observer.fire(200, 50);
        await Promise.resolve();

        resolvers[1]("second");
        await Promise.resolve();
        resolvers[0]("first");
        await Promise.resolve();

        assertThat(resize.container.textContent, is("second"));
    });
});
