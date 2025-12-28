/** @module
 * Module
 * **/
import {NodeDefinition} from "./NodeDefinition.ts";
import {ScriptTransformer} from "./ScriptTransformer.ts";
import {EndTransformer} from "./EndTransformer.ts";
import {StartTransformer} from "./StartTransformer.ts";
import {Bundler} from "../bundling/Bundler.ts";
import {CountingIdGenerator, type IdGenerator} from "../IdGenerator.ts";

/** Import map configuration for module resolution */
export interface ImportMap {
    imports?: Record<string, string>;
    scopes?: Record<string, Record<string, string>>;
    integrity?: Record<string, string>;
}

/** CSS selectors for HTML transformation targets */
export interface HTMLTransformerSelectors {
    start: string;
    script: string;
    end: string;
}

/** Dependencies required by HTMLTransformer */
export interface HTMLTransformerDependencies {
    rewriter: HTMLRewriter;
    bundler?: Bundler;
    importMap?: ImportMap;
    selectors?: Partial<HTMLTransformerSelectors>;
    idGenerator?: IdGenerator;
}

/** Default CSS selectors for head, reactive scripts, and body/islands */
export const DefaultSelectors: HTMLTransformerSelectors = {
    start: 'head',
    script: 'script[data-reactive],script[is=reactive]',
    end: 'body,*[data-reactive-island],*[is=reactive-island]'
}

/** Transforms HTML by processing reactive scripts and injecting runtime code */
export class HTMLTransformer {
    private idGenerator: IdGenerator;

    constructor(private deps: HTMLTransformerDependencies) {
        const selectors = {...DefaultSelectors, ...(deps.selectors ?? {})} as HTMLTransformerSelectors;
        const bundler = deps.bundler ?? Bundler.noOp;
        if (this.deps.importMap) this.deps.rewriter.on(selectors.start, new StartTransformer(this.deps.importMap));
        this.deps.rewriter.on(selectors.script, new ScriptTransformer(this));
        this.deps.rewriter.on(selectors.end, new EndTransformer(this, bundler));
        this.idGenerator = this.deps.idGenerator ?? new CountingIdGenerator();
    }

    transform(input: Response | Blob | Bun.BufferSource): Response;
    transform(input: string): string;
    transform(input: ArrayBuffer): ArrayBuffer;
    transform(input: any): any {
        return this.deps.rewriter.transform(input)
    }

    private definitions: NodeDefinition[][] = [];

    pushScope(): void {
        this.definitions.push([]);
    }

    addScript(javascript: string, id?: string): NodeDefinition {
        const definition = NodeDefinition.parse(javascript, id, this.idGenerator);
        this.definitions[this.definitions.length - 1].push(definition);
        return definition;
    }

    popDefinitions(): NodeDefinition[] {
        return this.definitions.pop() ?? [];
    }
}

