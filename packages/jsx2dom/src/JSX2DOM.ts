/** @module
 * Super light weight JSX to Native DOM
 */
import './types.d.ts';
import { attributeToProperty } from './attribute-mapping.ts';
import { SVG_ELEMENTS } from './svg-elements.ts';
import { svgPresentationToKebab } from './svg-presentation-mapping.ts';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/** JSX attributes - can be strings, booleans, numbers, functions, or style objects */
export type Attributes = { [key: string]: unknown } | null;
/** Supported nested JSX content */
export type Content = string | number | Node | Content[];

/** Explicit Dependencies for JSX2DOM, allows it to work with linkedom and yadic */
export interface JSX2DOMDependencies {
    document: Document,
    Node: typeof Node,
    HTMLElement: typeof HTMLElement,
    SVGElement: typeof SVGElement
}

/** JSX2DOM class, works with native DOM or linkedom */
export class JSX2DOM {
    constructor(private deps: JSX2DOMDependencies = globalThis) {
    }

    createElement(name: null, attributes: null, ...contents: Content[]): DocumentFragment;
    createElement(name: string, attributes: Attributes, ...contents: Content[]): HTMLElement | SVGElement;
    createElement(name: string | null, attributes: Attributes, ...contents: Content[]): Node {
        const {document} = this.deps;
        const isSVG = name !== null && SVG_ELEMENTS.has(name);

        const node = name === null
            ? document.createDocumentFragment()
            : isSVG
                ? document.createElementNS(SVG_NAMESPACE, name)
                : document.createElement(name);

        this.addAttributes(node, attributes, isSVG);
        this.addContent(node, contents);
        return node;
    }

    private addAttributes(node: Node, attributes: Attributes, isSVG: boolean = false) {
        const {HTMLElement, SVGElement} = this.deps;
        if (attributes === null) return;

        for (const [key, value] of Object.entries(attributes)) {
            if (value === undefined || value === null) continue;

            // Event handlers
            if (key.startsWith('on') && typeof value === 'function') {
                node.addEventListener(key.substring(2), value as EventListener);
                continue;
            }

            // Style support (object or string) - works for both HTML and SVG
            if (key === 'style' && (node instanceof HTMLElement || node instanceof SVGElement)) {
                if (typeof value === 'object') {
                    const style = (node as HTMLElement | SVGElement).style as unknown as Record<string, string>;
                    for (const [prop, val] of Object.entries(value as object)) {
                        if (val !== undefined && val !== null) {
                            style[prop] = String(val);
                        }
                    }
                } else if (typeof value === 'string') {
                    (node as HTMLElement | SVGElement).style.cssText = value;
                }
                continue;
            }

            // SVG: always use setAttribute (properties are read-only animated types)
            if (isSVG && node instanceof SVGElement) {
                // Convert camelCase to kebab-case for presentation attributes
                const attrName = svgPresentationToKebab[key] ?? key;
                node.setAttribute(attrName, String(value));
                continue;
            }

            // HTML: Map attribute names to DOM property names
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
