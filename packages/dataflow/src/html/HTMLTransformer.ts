/** @module
 * Module
 * **/
import {NodeDefinition} from "./NodeDefinition.ts";
import {ScriptTransformer} from "./ScriptTransformer.ts";
import {EndTransformer} from "./EndTransformer.ts";
import {StartTransformer} from "./StartTransformer.ts";
import {Bundler} from "../bundling/Bundler.ts";
import {CountingIdGenerator, type IdGenerator} from "../IdGenerator.ts";

export interface ImportMap {
    imports?: Record<string, string>;
    scopes?: Record<string, Record<string, string>>;
    integrity?: Record<string, string>;
}

export interface HTMLTransformerSelectors {
    start: string;
    script: string;
    end: string;
}

export interface HTMLTransformerDependencies {
    rewriter: HTMLRewriter;
    bundler?: Bundler;
    importMap?: ImportMap;
    selectors?: Partial<HTMLTransformerSelectors>;
    idGenerator?: IdGenerator;
}

export const DefaultSelectors: HTMLTransformerSelectors = {
    start: 'head',
    script: 'script[data-reactive],script[is=reactive]',
    end: 'body,*[data-reactive-island],*[is=reactive-island]'
}

/** HTMLTransformer **/
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

    private definitions: NodeDefinition[] = [];

    addScript(javascript: string, id?: string): string[] {
        const definition = NodeDefinition.parse(javascript, id, this.idGenerator);
        this.definitions.push(definition);
        return [definition.key, ...definition.outputs]
    }

    popDefinitions(): NodeDefinition[] {
        const definitions = this.definitions.slice();
        this.definitions.length = 0;
        return definitions;
    }
}

