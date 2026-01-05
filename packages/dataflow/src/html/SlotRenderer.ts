import type {SupportedValue} from "../api/display.ts";

export interface SlotRendererDependencies {
    document: Document,
    Node: typeof Node,
    HTMLElement: typeof HTMLElement,
    DocumentFragment: typeof DocumentFragment,
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
        return update.map(u => {
            if (typeof u === "string") {
                return document.createTextNode(u);
            } else if (typeof u === "number") {
                return document.createTextNode(String(u));
            } else if (u instanceof Node) {
                return u;
            }
        }).filter(u => u !== undefined);
    }

    updateSlot(slot: HTMLSlotElement, newNodes: Node[]) {
        while (slot.childNodes.length > newNodes.length) slot.removeChild(slot.lastChild!);
        const slotChildren = Array.from(slot.childNodes);
        for (let i = 0; i < newNodes.length; i++) {
            const newChild = newNodes[i];
            const slotChild = slotChildren[i];
            if (slotChild === undefined) slot?.appendChild(newChild);
            else if (!this.nodeEquality(newChild, slotChild)) slotChild.replaceWith(newChild);
        }
    }

    nodeEquality(a: Node, b: Node) {
        const {HTMLElement} = this.deps;
        return a instanceof HTMLElement && b instanceof HTMLElement
            ? this.elementEquality(a, b)
            : a.isEqualNode(b);
    }

    elementEquality(a: HTMLElement, b: HTMLElement) {
        if (a.hasAttribute('data-unique') || b.hasAttribute('data-unique')) return false;
        return a.isEqualNode(b) && a.style.cssText === b.style.cssText;
    }
}
