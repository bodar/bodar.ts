export interface SlotRendererDependencies {
    document: Document,
    Node: typeof Node,
    DocumentFragment: typeof DocumentFragment,
}

export class SlotRenderer {
    constructor(private deps: SlotRendererDependencies) {

    }

    render(slot: HTMLSlotElement, update: any): void {
        const newNode = this.createNode(update);
        if (newNode) this.updateSlot(slot, newNode);
    }

    createNode(update: any): Node | undefined {
        const {document, Node} = this.deps;
        if (Array.isArray(update)) {
            const fragment = document.createDocumentFragment();
            fragment.replaceChildren(...update.map(u => this.createNode(u)).filter(u => u !== undefined));
            return fragment;
        } else if (typeof update === "string") {
            return document.createTextNode(update);
        } else if (typeof update === "number") {
            return document.createTextNode(String(update));
        }
        if (update instanceof Node) {
            return update;
        }
    }

    updateSlot(slot: HTMLSlotElement, newNode: Node) {
        const {DocumentFragment} = this.deps;
        if (newNode instanceof DocumentFragment) {
            while (slot.childNodes.length > newNode.childNodes.length) slot.removeChild(slot.lastChild!);
            // copy the children as when we move them from the fragment the index will change
            const newNodeChildren = Array.from(newNode.childNodes);
            const slotChildren = Array.from(slot.childNodes);
            for (let i = 0; i < newNodeChildren.length; i++) {
                const newChild = newNodeChildren[i];
                const slotChild = slotChildren[i];
                if (slotChild === undefined) slot?.appendChild(newChild);
                else if (!newChild.isEqualNode(slotChild)) slotChild.replaceWith(newChild);
            }
        } else if (slot.childNodes.length === 1) {
            if (!slot.childNodes[0].isEqualNode(newNode)) slot.replaceChildren(newNode);
        } else {
            slot.replaceChildren(newNode);
        }
    }
}