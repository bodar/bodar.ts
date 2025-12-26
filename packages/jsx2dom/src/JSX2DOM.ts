/** @module
 * Super light weight JSX to Native DOM
 */
import './types.d.ts';
import { attributeToProperty } from './attribute-mapping.ts';

/** JSX attributes - can be strings, booleans, numbers, functions, or style objects */
export type Attributes = { [key: string]: unknown } | null;
/** Supported nested JSX content */
export type Content = string | number | Node | Content[];

/** Explicit Dependencies for JSX2DOM, allows it to work with linkedom and yadic */
export interface JSX2DOMDependencies {
    document: Document,
    Node: typeof Node,
    HTMLElement: typeof HTMLElement
}

/** JSX2DOM class, works with native DOM or linkedom */
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
        if (attributes === null) return;

        for (const [key, value] of Object.entries(attributes)) {
            if (value === undefined || value === null) continue;

            // Event handlers
            if (key.startsWith('on') && typeof value === 'function') {
                node.addEventListener(key.substring(2), value as EventListener);
                continue;
            }

            // Style support (object or string)
            if (key === 'style' && node instanceof HTMLElement) {
                if (typeof value === 'object') {
                    const style = node.style as unknown as Record<string, string>;
                    for (const [prop, val] of Object.entries(value as object)) {
                        if (val !== undefined && val !== null) {
                            style[prop] = String(val);
                        }
                    }
                } else if (typeof value === 'string') {
                    node.style.cssText = value;
                }
                continue;
            }

            // Map HTML attribute names to DOM property names
            const propertyName = (attributeToProperty as Record<string, string>)[key] ?? key;

            // Try to set as property first, fall back to setAttribute
            if (propertyName in node) {
                try {
                    Reflect.set(node, propertyName, value);
                } catch {
                    if (node instanceof HTMLElement) node.setAttribute(key, String(value));
                }
            } else if (node instanceof HTMLElement) {
                node.setAttribute(key, String(value));
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