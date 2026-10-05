import type {SupportedValue} from "../api/display.ts";
import {flatten, place} from "@bodar/jsx2dom/PositionalJSX.ts";

export interface SlotRendererDependencies {
    document: Document,
    Node: typeof Node,
    HTMLElement: typeof HTMLElement,
    DocumentFragment: typeof DocumentFragment,
}

/** Finds the named slot belonging to root's scope, skipping slots inside nested islands (keys are only unique per transform) */
export function findSlot(root: Element, key: string): HTMLSlotElement | undefined {
    return Array.from(root.querySelectorAll<HTMLSlotElement>(`slot[name="${key}"]`))
        .find(slot => (slot.closest('[is=reactive-island],[data-reactive-island]') ?? root) === root);
}

export class SlotRenderer {
    constructor(private deps: SlotRendererDependencies) {

    }

    render(slot: HTMLSlotElement, update: SupportedValue[]): void {
        const newNodes = this.createNode(update);
        this.updateSlot(slot, newNodes);
    }

    createNode(update: SupportedValue[]): Node[] {
        const {document, Node} = this.deps;
        return flatten(update, Node).flatMap(u => u instanceof Node ? [u]
            : typeof u === "string" || typeof u === "number" ? [document.createTextNode(String(u))] : []);
    }

    /** Keeps a node that is the same node, places the rest (moving only misplaced ones) */
    updateSlot(slot: HTMLSlotElement, newNodes: Node[]) {
        place(slot, Array.from(slot.childNodes), newNodes);
    }
}
