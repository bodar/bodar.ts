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
        for (let i = 0; i < newNodes.length; i++) {
            const newChild = newNodes[i];
            const slotChild = slot.childNodes[i];
            if (slotChild === undefined) slot?.appendChild(newChild);
            else if (!newChild.isEqualNode(slotChild)) slotChild.replaceWith(newChild);
        }
    }
}
