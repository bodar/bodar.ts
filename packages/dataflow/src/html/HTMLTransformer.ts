/** @module
 * Module
 * **/
import {NodeDefinition, parseNodeDefinition} from "./NodeDefinition.ts";
import {ScriptTransformer} from "./ScriptTransformer.ts";
import {BodyTransformer} from "./BodyTransformer.ts";

/** HTMLTransformer **/
export class HTMLTransformer {
    constructor(private rewriter: HTMLRewriter) {
        this.rewriter.on('script[reactive]', new ScriptTransformer(this))
        this.rewriter.on('body', new BodyTransformer(this))
    }

    transform(input: Response | Blob | Bun.BufferSource): Response;
    transform(input: string): string;
    transform(input: ArrayBuffer): ArrayBuffer;
    transform(input: any): any {
        return this.rewriter.transform(input)
    }

    definitions: NodeDefinition[] = [];

    addScript(javascript: string, id?: string): string[] {
        const definition = parseNodeDefinition(javascript, id);
        this.definitions.push(definition);
        return [definition.key, ...definition.outputs]
    }
}

