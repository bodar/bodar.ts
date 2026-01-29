/** @module
 * Module
 * **/
import {ScriptTransformer} from "./ScriptTransformer.ts";
import {EndTransformer} from "./EndTransformer.ts";
import {StartTransformer} from "./StartTransformer.ts";
import {Bundler} from "../bundling/Bundler.ts";
import type {IdGenerator} from "../IdGenerator.ts";
import {
    TransformationController,
    DefaultSelectors,
    type TypeTransformer,
    type ImportMap,
    type TransformerSelectors
} from "./TransformationController.ts";

// Re-export shared types for backwards compatibility
export type {TypeTransformer, ImportMap} from "./TransformationController.ts";
export {DefaultSelectors} from "./TransformationController.ts";

/** @deprecated Use TransformerSelectors from TransformationController instead */
export type HTMLTransformerSelectors = TransformerSelectors;

/** Dependencies required by HTMLTransformer */
export interface HTMLTransformerDependencies {
    rewriter: HTMLRewriter;
    bundler?: Bundler;
    importMap?: ImportMap;
    selectors?: Partial<TransformerSelectors>;
    idGenerator?: IdGenerator;
    idle?: boolean;
    typeTransformers?: Record<string, TypeTransformer>;
}

/** Transforms HTML by processing reactive scripts and injecting runtime code */
export class HTMLTransformer {
    private readonly controller: TransformationController;

    constructor(private deps: HTMLTransformerDependencies) {
        const selectors = {...DefaultSelectors, ...(deps.selectors ?? {})} as TransformerSelectors;
        this.controller = new TransformationController({
            bundler: deps.bundler ?? Bundler.noOp,
            idGenerator: deps.idGenerator,
            idle: deps.idle,
            typeTransformers: deps.typeTransformers
        });
        if (this.deps.importMap) this.deps.rewriter.on(selectors.start, new StartTransformer(this.deps.importMap));
        this.deps.rewriter.on(selectors.script, new ScriptTransformer(this.controller));
        this.deps.rewriter.on(selectors.end, new EndTransformer(this.controller));
    }

    get idGenerator(): IdGenerator {
        return this.controller.idGenerator;
    }

    get idle(): boolean {
        return this.controller.idle;
    }

    transform(input: Response | Blob | Bun.BufferSource): Response;
    transform(input: string): string;
    transform(input: ArrayBuffer): ArrayBuffer;
    transform(input: any): any {
        return this.deps.rewriter.transform(input)
    }
}
