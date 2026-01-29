/** @module
 * DOM-based transformer that mutates a Document in-place.
 * Works with DOMParser, linkedom, or any DOM implementation.
 **/
import type {Bundler} from "../bundling/Bundler.ts";
import type {IdGenerator} from "../IdGenerator.ts";
import {
    TransformationController,
    DefaultSelectors,
    trimIndent,
    type TypeTransformer,
    type ImportMap,
    type TransformerSelectors
} from "./TransformationController.ts";

/** Dependencies required by DOMTransformer */
export interface DOMTransformerDependencies {
    bundler?: Bundler;
    importMap?: ImportMap;
    selectors?: Partial<TransformerSelectors>;
    idGenerator?: IdGenerator;
    idle?: boolean;
    typeTransformers?: Record<string, TypeTransformer>;
}

/** Transforms a DOM Document by processing reactive scripts and injecting runtime code */
export class DOMTransformer {
    private readonly controller: TransformationController;
    private readonly importMap?: ImportMap;
    private readonly selectors: TransformerSelectors;

    constructor(deps: DOMTransformerDependencies = {}) {
        this.controller = new TransformationController({
            bundler: deps.bundler,
            idGenerator: deps.idGenerator,
            idle: deps.idle,
            typeTransformers: deps.typeTransformers
        });
        this.importMap = deps.importMap;
        this.selectors = {...DefaultSelectors, ...(deps.selectors ?? {})};
    }

    get idGenerator(): IdGenerator {
        return this.controller.idGenerator;
    }

    get idle(): boolean {
        return this.controller.idle;
    }

    /** Transform a DOM Document in-place */
    async transform(document: Document): Promise<void> {
        // Inject import map into head if provided
        if (this.importMap) {
            const head = document.querySelector(this.selectors.start);
            if (head) {
                const importMapScript = document.createElement('script');
                importMapScript.type = 'importmap';
                importMapScript.textContent = JSON.stringify(this.importMap);
                head.prepend(importMapScript);
            }
        }

        // Compose selectors to get all relevant elements in document order
        const combined = `${this.selectors.end},${this.selectors.script}`;
        const elements = Array.from(document.querySelectorAll(combined));
        const scopeStack: Element[] = [];

        // Process elements in document order (simulates streaming)
        for (const element of elements) {
            // Before processing, close any scopes that don't contain this element
            // This simulates encountering end tags in streaming order
            await this.closeNonAncestorScopes(element, scopeStack);

            if (element.matches(this.selectors.end)) {
                // Entering a new scope
                this.controller.pushScope();
                scopeStack.push(element);
            }
            if (element.matches(this.selectors.script)) {
                // Process script in current scope
                this.processScript(document, element);
            }
        }

        // Close any remaining open scopes
        await this.closeAllScopes(scopeStack);
    }

    /** Close scopes that don't contain the given element */
    private async closeNonAncestorScopes(element: Element, scopeStack: Element[]): Promise<void> {
        while (scopeStack.length > 0) {
            const currentScope = scopeStack[scopeStack.length - 1];
            if (currentScope.contains(element)) {
                break; // Element is inside current scope, stop closing
            }
            await this.closeScope(scopeStack);
        }
    }

    /** Close all remaining scopes */
    private async closeAllScopes(scopeStack: Element[]): Promise<void> {
        while (scopeStack.length > 0) {
            await this.closeScope(scopeStack);
        }
    }

    /** Pop and generate runtime for the top scope */
    private async closeScope(scopeStack: Element[]): Promise<void> {
        const scope = scopeStack.pop()!;
        const result = await this.controller.generateRuntimeScript();
        if (result) {
            const runtimeScript = scope.ownerDocument!.createElement('script');
            runtimeScript.type = 'module';
            runtimeScript.setAttribute('is', 'reactive-runtime');
            runtimeScript.id = result.scriptId;
            runtimeScript.textContent = result.javascript;
            scope.appendChild(runtimeScript);
        }
    }

    private processScript(document: Document, script: Element): void {
        const attributes = new Map<string, string>();
        for (const attr of Array.from(script.attributes)) {
            attributes.set(attr.name, attr.value);
        }

        const javascript = trimIndent(script.textContent ?? '');
        const definition = this.controller.addScript(javascript, attributes);

        // Handle echo feature
        if (attributes.has('data-echo')) {
            this.insertEcho(document, script, attributes, javascript);
        }

        // Insert slot if needed
        if (definition.hasDisplay() || definition.hasWidth()) {
            const slot = document.createElement('slot');
            slot.setAttribute('name', definition.key);
            script.parentNode?.insertBefore(slot, script);
        }

        // Remove the original script
        script.remove();
    }

    private insertEcho(document: Document, script: Element, attributes: Map<string, string>, javascript: string): void {
        const echo = attributes.get('data-echo') || 'javascript';

        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.className = `language-${echo}`;

        if (echo === 'html') {
            // Format as HTML with script tag
            const formattedAttrs = this.formatAttributes(attributes);
            code.textContent = `<script${formattedAttrs}>\n${javascript}\n</script>`;
        } else {
            code.textContent = javascript;
        }

        pre.appendChild(code);
        script.parentNode?.insertBefore(pre, script);
    }

    private formatAttributes(attributes: Map<string, string>): string {
        const filtered = new Map(attributes);
        filtered.delete('data-echo');
        return Array.from(filtered.entries(), ([key, value]) => {
            return ` ${key}${value ? `="${value}"` : ''}`;
        }).join('');
    }
}
