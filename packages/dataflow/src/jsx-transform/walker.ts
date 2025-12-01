import type {Node} from "acorn";

export interface WalkerContext {
    skip: () => void;
    remove: () => void;
    replace: (node: Node) => void;
}

export type WalkHandler = (
    this: WalkerContext,
    node: Node,
    parent: Node | null,
    key: string | null,
    index: number | null
) => void;

class Walker {
    private should_skip = false;
    private should_remove = false;
    private replacement: Node | null = null;

    readonly context: WalkerContext = {
        skip: () => (this.should_skip = true),
        remove: () => (this.should_remove = true),
        replace: (node) => (this.replacement = node)
    };

    constructor(
        private enter?: WalkHandler,
        private leave?: WalkHandler
    ) {}

    private replaceNode(parent: any, prop: string, index: number | null, node: Node): void {
        if (parent) {
            if (index !== null) {
                parent[prop][index] = node;
            } else {
                parent[prop] = node;
            }
        }
    }

    private removeNode(parent: any, prop: string, index: number | null): void {
        if (parent) {
            if (index !== null) {
                parent[prop].splice(index, 1);
            } else {
                delete parent[prop];
            }
        }
    }

    visit(node: Node | null, parent: Node | null, prop?: string | null, index?: number | null): Node | null {
        if (!node) return node;

        if (this.enter) {
            const prevSkip = this.should_skip;
            const prevRemove = this.should_remove;
            const prevReplacement = this.replacement;

            this.should_skip = false;
            this.should_remove = false;
            this.replacement = null;

            this.enter.call(this.context, node, parent, prop ?? null, index ?? null);

            if (this.replacement) {
                (this.replacement as Node).range = node.range;
                node = this.replacement;
                this.replaceNode(parent, prop!, index ?? null, node);
            }

            if (this.should_remove) {
                this.removeNode(parent, prop!, index ?? null);
            }

            const skipped = this.should_skip;
            const removed = this.should_remove;

            this.should_skip = prevSkip;
            this.should_remove = prevRemove;
            this.replacement = prevReplacement;

            if (skipped) return node;
            if (removed) return null;
        }

        for (const key in node) {
            const value = (node as any)[key];

            if (typeof value !== "object" || value === null) {
                continue;
            }

            if (Array.isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    if (value[i] !== null && typeof value[i].type === "string") {
                        if (!this.visit(value[i], node, key, i)) {
                            i--; // Element was removed, adjust index
                        }
                    }
                }
            } else if (typeof value.type === "string") {
                this.visit(value, node, key, null);
            }
        }

        if (this.leave) {
            const prevReplacement = this.replacement;
            const prevRemove = this.should_remove;

            this.replacement = null;
            this.should_remove = false;

            this.leave.call(this.context, node, parent, prop ?? null, index ?? null);

            if (this.replacement) {
                (this.replacement as Node).range = node.range;
                node = this.replacement;
                this.replaceNode(parent, prop!, index ?? null, node);
            }

            if (this.should_remove) {
                this.removeNode(parent, prop!, index ?? null);
            }

            const removed = this.should_remove;

            this.replacement = prevReplacement;
            this.should_remove = prevRemove;

            if (removed) return null;
        }

        return node;
    }
}

export function walk<T extends Node>(ast: T, handlers: { enter?: WalkHandler; leave?: WalkHandler }): T {
    const walker = new Walker(handlers.enter, handlers.leave);
    return walker.visit(ast, null) as T;
}
