/** @module
 * Super light weight JSX to Native DOM
 */
import './types.d.ts';
import {BOOLEAN_ATTRIBUTES} from './boolean-attributes.ts';
import {isSVG} from './svg-elements.ts';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/** JSX attributes - can be strings, booleans, numbers, functions, or style objects */
export type Attributes = { [key: string]: unknown };
/** Supported nested JSX content */
export type Content = string | number | Node | Content[];

export type SupportedNode = DocumentFragment | SupportedElement;
export type SupportedElement = HTMLElement | SVGElement;

/** Explicit Dependencies for JSX2DOM, allows it to work with linkedom and yadic */
export interface JSX2DOMDependencies {
    document: Document,
    Node: typeof Node,
}

/** JSX2DOM class, works with native DOM or linkedom */
export class JSX2DOM {
    constructor(private deps: JSX2DOMDependencies = globalThis) {
    }

    createElement(name: null, attributes: null, ...contents: Content[]): DocumentFragment;
    createElement(name: string, attributes: Attributes | null, ...contents: Content[]): HTMLElement | SVGElement;
    createElement(name: string | null, attributes: Attributes | null, ...contents: Content[]): Node {
        const {document} = this.deps;
        if (name === null) {
            return this.addContent(document.createDocumentFragment(), contents);
        } else {
            const element: SupportedElement = isSVG(name)
                ? document.createElementNS(SVG_NAMESPACE, name)
                : document.createElement(name);

            if (attributes) this.addAttributes(element, attributes);
            return this.addContent(element, contents);
        }
    }

    private addAttributes(element: SupportedElement, attributes: Attributes) {
        for (const [key, value] of Object.entries(attributes)) {
            if (value === undefined || value === null) continue;

            if (key.startsWith('on') && typeof value === 'function') {
                element.addEventListener(key.substring(2), value as EventListener);
            } else if (key === 'style') {
                if (typeof value === 'object') {
                    for (const [prop, val] of Object.entries(value)) {
                        if (val !== undefined && val !== null) {
                            Reflect.set(element.style, prop, String(val));
                        }
                    }
                } else if (typeof value === 'string') {
                    element.style.cssText = value;
                }
            } else if (!isSVG(element) && BOOLEAN_ATTRIBUTES.has(key)) {
                if (value === true) {
                    element.setAttribute(key, '');
                }
            } else {
                element.setAttribute(key, String(value));
            }
        }
    }

    private addContent(node: SupportedNode, contents: Content[]) {
        const {document, Node} = this.deps;
        for (const content of contents) {
            if (Array.isArray(content)) {
                this.addContent(node, content);
            } else {
                node.appendChild(content instanceof Node ? content : document.createTextNode(String(content)));
            }
        }
        return node;
    }
}
