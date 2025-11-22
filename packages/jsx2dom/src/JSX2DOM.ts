/** @module
 * Super light weight JSX to Native DOM
 */
/// <reference path="./types.d.ts" />
export type Attributes = { [key: string]: string } | null;
export type Content = string | number | Node | Content[];

export interface JSX2DOMDependencies {
    document: Document,
    Node: typeof Node,
    HTMLElement: typeof HTMLElement
}

export class JSX2DOM {
    constructor(private deps: JSX2DOMDependencies = globalThis) {
    }

    createElement(name: null, attributes: null, ...contents: Content[]): DocumentFragment;
    createElement(name: string, attributes: Attributes, ...contents: Content[]): HTMLElement;
    createElement(name: string | null, attributes: Attributes, ...contents: Content[]): Node {
        const {document} = this.deps;
        const node = name === null ? document.createDocumentFragment() : document.createElement(name);
        this.addAttributes(node, attributes);
        this.addContent(node, contents);
        return node;
    }

    private addAttributes(node: Node, attributes: Attributes) {
        const {HTMLElement} = this.deps;
        if (attributes !== null) {
            for (const [key, value] of Object.entries(attributes)) {
                if (key.startsWith('on') && typeof value === 'function') {
                    node.addEventListener(key.substring(2), value);
                } else {
                    if (node instanceof HTMLElement) node.setAttribute(key, value);
                }
            }
        }
    }

    private addContent(node: Node, contents: Content[]) {
        const {document, Node} = this.deps;
        for (const content of contents) {
            if (Array.isArray(content)) {
                this.addContent(node, content);
            } else {
                node.appendChild(content instanceof Node ? content : document.createTextNode(String(content)));
            }
        }
    }
}