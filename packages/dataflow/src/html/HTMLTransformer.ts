/** @module
 * Module
 * **/
import {NodeDefinition} from "./NodeDefinition.ts";
import {ScriptTransformer} from "./ScriptTransformer.ts";
import {BodyTransformer} from "./BodyTransformer.ts";
import {HeadTransformer} from "./HeadTransformer.ts";
import type {Bundler} from "../bundling/Bundler.ts";

export interface ImportMap {
    imports?: Record<string, string>;
    scopes?: Record<string, Record<string, string>>;
    integrity?: Record<string, string>;
}

export interface HTMLTransformerDependencies {
    rewriter: HTMLRewriter;
    bundler: Bundler;
    importMap?: ImportMap;
}

/** HTMLTransformer **/
export class HTMLTransformer {
    constructor(private deps: HTMLTransformerDependencies) {
        if (this.deps.importMap) this.deps.rewriter.on('head', new HeadTransformer(this.deps.importMap))
        this.deps.rewriter.on('script[data-reactive]', new ScriptTransformer(this))
        this.deps.rewriter.on('body', new BodyTransformer(this, this.deps.bundler))
    }

    transform(input: Response | Blob | Bun.BufferSource): Response;
    transform(input: string): string;
    transform(input: ArrayBuffer): ArrayBuffer;
    transform(input: any): any {
        return this.deps.rewriter.transform(input)
    }

    private definitions: NodeDefinition[] = [];

    addScript(javascript: string, id?: string): string[] {
        const definition = NodeDefinition.parse(javascript, id);
        this.definitions.push(definition);
        return [definition.key, ...definition.outputs]
    }

    popDefinitions(): NodeDefinition[] {
        const definitions = this.definitions.slice();
        this.definitions.length = 0;
        return definitions;
    }
}

