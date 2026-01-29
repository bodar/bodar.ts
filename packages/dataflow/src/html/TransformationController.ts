/** @module
 * Shared transformation logic used by both HTMLTransformer and DOMTransformer
 **/
import {NodeDefinition} from "./NodeDefinition.ts";
import {CountingIdGenerator, type IdGenerator} from "../IdGenerator.ts";
import {topologicalSort} from "./TopologicalSort.ts";
import type {Bundler} from "../bundling/Bundler.ts";
import {Bundler as BundlerImpl} from "../bundling/Bundler.ts";
import type {RuntimeConfig} from "../runtime.ts";

/** Function that transforms script content before parsing */
export type TypeTransformer = (content: string, attributes: Map<string, string>, key: string) => string;

/** Import map configuration for module resolution */
export interface ImportMap {
    imports?: Record<string, string>;
    scopes?: Record<string, Record<string, string>>;
    integrity?: Record<string, string>;
}

/** CSS selectors for HTML transformation targets */
export interface TransformerSelectors {
    start: string;
    script: string;
    end: string;
}

/** Default CSS selectors for head, reactive scripts, and body/islands */
export const DefaultSelectors: TransformerSelectors = {
    start: 'head',
    script: 'script[data-reactive],script[is=reactive]',
    end: 'body,*[data-reactive-island],*[is=reactive-island]'
}

/** Dependencies required by TransformationController */
export interface TransformationControllerDependencies {
    bundler?: Bundler;
    idGenerator?: IdGenerator;
    idle?: boolean;
    typeTransformers?: Record<string, TypeTransformer>;
}

/** Shared controller that manages transformation state and logic */
export class TransformationController {
    public readonly idGenerator: IdGenerator;
    public readonly idle: boolean;
    private readonly typeTransformers: Record<string, TypeTransformer>;
    private readonly bundler: Bundler;
    private definitions: NodeDefinition[][] = [];

    constructor(deps: TransformationControllerDependencies = {}) {
        this.idGenerator = deps.idGenerator ?? new CountingIdGenerator();
        this.idle = !!deps.idle;
        this.typeTransformers = deps.typeTransformers ?? {};
        this.bundler = deps.bundler ?? BundlerImpl.noOp;
    }

    pushScope(): void {
        this.definitions.push([]);
    }

    addScript(javascript: string, attributes: Map<string, string>): NodeDefinition {
        const key = attributes.get('id') ?? this.idGenerator.generate(javascript);
        const type = attributes.get('type') ?? 'module';
        const transformer = this.typeTransformers[type];
        const transformed = transformer ? transformer(javascript, attributes, key) : javascript;
        const definition = NodeDefinition.parse(transformed, key);
        this.definitions[this.definitions.length - 1].push(definition);
        return definition;
    }

    popDefinitions(): NodeDefinition[] {
        return this.definitions.pop() ?? [];
    }

    /** Generate the runtime script content for the current scope */
    async generateRuntimeScript(): Promise<{scriptId: string; javascript: string} | undefined> {
        const definitions = this.popDefinitions();
        if (definitions.length === 0) return undefined;

        const sorted = topologicalSort(definitions);

        const imports = new Set<string>(['runtime']);
        for (const d of sorted) {
            for (const imp of d.getUsedDirectImports()) imports.add(imp);
            if (d.hasDisplay()) imports.add('Display');
            if (d.hasExplicitView()) imports.add('View');
            if (d.hasWidth()) imports.add('Width');
            if (d.hasJsx()) imports.add('JSX2DOM').add('autoKeyEvents').add('chain');
            if (d.hasNow()) imports.add('now');
        }

        const registrations = [
            imports.has('JSX2DOM') && `_runtime_.graph.define("jsx",[],[],() => new JSX2DOM(chain({onEventListener: autoKeyEvents()}, globalThis)));`,
            imports.has('now') && `_runtime_.graph.define("now",[],[],() => now());`,
            ...sorted.flatMap((d: NodeDefinition) => [
                d.hasWidth() && `_runtime_.graph.define("width_${d.key}",[],[],() => Width.for("${d.key}", _runtime_));`,
                `_runtime_.graph.define(${d.toString()});`
            ])
        ].filter(Boolean).join('\n');

        const scriptId = this.idGenerator.generate(registrations);
        const javascript = await this.bundler.transform(scriptTemplate({scriptId, idle: this.idle}, imports, registrations));

        return {scriptId, javascript};
    }
}

/** Generate the runtime script template */
export function scriptTemplate(config: RuntimeConfig, imports: Set<string>, registrations: string): string {
    // language=javascript
    return `import {${([...imports].join(','))}} from "@bodar/dataflow/runtime.ts";
const _runtime_ = runtime(${JSON.stringify(config)}, globalThis);
${registrations}
_runtime_.graph.run();`;
}

/** Remove common leading indentation from text */
export function trimIndent(text: string): string {
    const lines = text.split('\n');
    const firstNonEmptyIndex = lines.findIndex(line => line.trim().length > 0);
    if (firstNonEmptyIndex === -1) return '';

    const firstNonEmptyLine = lines[firstNonEmptyIndex];
    const match = firstNonEmptyLine.match(/^(\s*)/);
    const indent = match ? match[1] : '';
    const indentLength = indent.length;

    const relevantLines = lines.slice(firstNonEmptyIndex);

    if (indentLength === 0) return relevantLines.map(line => line.trimEnd()).join('\n').trimEnd();

    return relevantLines
        .map(line => (line.startsWith(indent) ? line.slice(indentLength) : line.trimStart()).trimEnd())
        .join('\n')
        .trimEnd();
}
