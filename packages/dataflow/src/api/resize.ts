export type Renderer = (width: number, height?: number) => Node | string | null | Promise<Node | string | null>;

export interface ResizeDependencies {
    render: Renderer;
    document: Document;
    HTMLElement: typeof HTMLElement;
    ResizeObserver: typeof ResizeObserver;
}

export class Resize {
    public observer: ResizeObserver;
    public container: HTMLDivElement;
    private renderCount = 0;
    private displayCount = 0;
    private lastWidth?: number;

    constructor(
        private deps: ResizeDependencies
    ) {
        this.container = deps.document.createElement("div");
        this.container.style.position = "relative";
        if (this.usesHeight()) this.container.style.height = "100%";

        this.observer = new deps.ResizeObserver(([entry]) => this.onResize(entry));
        this.observer.observe(this.container);
    }

    private usesHeight(): boolean {
        return this.deps.render.length !== 1;
    }

    private async onResize(entry: ResizeObserverEntry): Promise<void> {
        const {HTMLElement} = this.deps;
        const {width, height} = entry.contentRect;

        if (this.displayCount > 0 && !this.container.isConnected) {
            this.observer.disconnect();
            return;
        }

        if (!this.usesHeight() && width === this.lastWidth) return;
        this.lastWidth = width;

        if (width === 0) return;

        const renderId = ++this.renderCount;
        const child = await this.deps.render(width, height);

        if (this.displayCount > renderId) return;
        this.displayCount = renderId;

        this.container.replaceChildren();
        if (child == null) return;
        if (this.usesHeight() && child instanceof HTMLElement) {
            child.style.position = "absolute";
        }
        this.container.append(child);
    }
}

export function resize(render: Renderer): Node {
    return new Resize({
        render,
        document: globalThis.document,
        HTMLElement: globalThis.HTMLElement,
        ResizeObserver: globalThis.ResizeObserver
    },).container;
}
