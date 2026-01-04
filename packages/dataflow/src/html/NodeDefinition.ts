import {Imports, processImports} from "../javascript/Imports.ts";
import {parseScript, processJSX, toScript} from "../javascript/script-parsing.ts";
import {findUnresolvedReferences} from "../javascript/findUnresolvedReferences.ts";
import {findTopLevelDeclarations} from "../javascript/findTopLevelDeclarations.ts";
import {isSingleExpression} from "../javascript/isSingleExpression.ts";
import {hasTopLevelAwait} from "../javascript/findTopLevelAwaits.ts";
import {type IdGenerator, SimpleHashGenerator} from "../IdGenerator.ts";

export interface SerializeOptions {
    stripDisplay?: boolean;
    stripView?: boolean;
    stripWidth?: boolean;
}

/** A definition of a Node but still in raw text format */
export class NodeDefinition {
    private readonly Runtime = '@bodar/dataflow/runtime.ts';

    constructor(private _key: string,
                private _inputs: string[],
                private _outputs: string[],
                private _imports: Imports,
                private _singleExpression: boolean,
                private _hasTopLevelAwait: boolean,
                private _body: string
    ) {
    }

    static parse(javascript: string, id?: string, idGenerator: IdGenerator = SimpleHashGenerator): NodeDefinition {
        const key = id || idGenerator.generate(javascript);
        try {
            const program = processJSX(parseScript(javascript));
            const inputs = findUnresolvedReferences(program);
            const outputs = findTopLevelDeclarations(program);
            const imports = processImports(program);
            const singleExpression = isSingleExpression(program);
            const topLevelAwait = hasTopLevelAwait(program);
            const newJavascript = toScript(program);
            return new NodeDefinition(key, inputs, [...outputs, ...imports.locals()], imports, singleExpression, topLevelAwait, newJavascript);
        } catch (error: any) {
            return (new NodeDefinition(key, [], [], Imports.empty, true, false, JSON.stringify(error.message)));
        }
    }

    get key(): string {
        return this._key;
    }

    get inputs(): string[] {
        return this._inputs;
    }

    get outputs(): string[] {
        return this._outputs;
    }

    get imports(): Imports {
        return this._imports;
    }

    importsExpressions(imports: Imports = this._imports): string {
        if (imports.isEmpty()) return "";

        const entries = Array.from(imports.data.entries());
        const specifierStrings = entries.map(([, imp]) => imp.specifier);
        const importStrings = entries.map(([source]) => `import('${source}')`);
        return `const [${specifierStrings.join(', ')}] = await Promise.all([${importStrings.join(', ')}]);`;
    }

    isSingleExpression(): boolean {
        return this._singleExpression;
    }

    isLambda(): boolean {
        return this.isSingleExpression() && this.outputs.length === 0 && this.imports.isEmpty();
    }

    isAsync(options?: SerializeOptions): boolean {
        return !this.getImports(options).isEmpty() || this._hasTopLevelAwait;
    }

    toString(options?: SerializeOptions): string {
        const inputs = this.getInputs(options);
        const outputs = this.getOutputs(options);
        return `${JSON.stringify(this.key)},${JSON.stringify(inputs)},${JSON.stringify(outputs)},${this.fun(options)}`;
    }

    fun(options?: SerializeOptions): string {
        const inputs = this.getInputs(options);
        return `${this.isAsync(options) ? 'async' : ''}(${inputs.join(',')}) => {\n${this.body(options)}\n}`;
    }

    private getInputs(options?: SerializeOptions): string[] {
        let inputs = this._inputs;
        if (options?.stripDisplay) inputs = inputs.filter(i => i !== 'display');
        if (options?.stripView) inputs = inputs.filter(i => i !== 'view');
        if (options?.stripWidth) inputs = inputs.map(i => i === 'width' ? `width_${this.key}` : i);
        return inputs;
    }

    private getOutputs(options?: SerializeOptions): string[] {
        let outputs = this._outputs;
        if (options?.stripDisplay) outputs = outputs.filter(o => o !== 'display');
        if (options?.stripView) outputs = outputs.filter(o => o !== 'view');
        if (options?.stripWidth) outputs = outputs.filter(o => o !== 'width');
        return outputs;
    }

    private getImports(options?: SerializeOptions): Imports {
        if (!options?.stripDisplay && !options?.stripView) return this._imports;

        const imports = this._imports.clone();
        if (options?.stripDisplay) imports.removeSpecifier(this.Runtime, 'display');
        if (options?.stripView) imports.removeSpecifier(this.Runtime, 'view');
        if (options?.stripWidth) imports.removeSpecifier(this.Runtime, 'width');
        return imports;
    }

    body(options?: SerializeOptions): string {
        const imports = this.getImports(options);
        const outputs = this.getOutputs(options);
        return [
            this.importsExpressions(imports),
            this.hasImplicitDisplay() || this.hasExplicitDisplay() || this.hasExplicitView() ? `const display = Display.for(${JSON.stringify(this._key)}, _runtime_);` : undefined,
            this.hasExplicitView() ? `const view = View.for(display);` : undefined,
            this.hasWidthInput() ? `const width = width_${this._key};` : undefined,
            outputs.length ? `${this._body}\nreturn {${outputs.join(',')}};` : this._singleExpression && !this.hasExplicitDisplay() && !this.hasExplicitView() ? `return display(${this._body.replace(/;$/, '')})` : this._body
        ].filter(l => l).join('\n');
    }

    hasImplicitDisplay(): boolean {
        return this._singleExpression && !this.hasExplicitDisplay();
    }

    hasExplicitDisplay(): boolean {
        return this._imports.get(this.Runtime)?.locals.includes('display') || this._inputs.some(v => v === 'display');
    }

    hasExplicitView(): boolean {
        return this._imports.get(this.Runtime)?.locals.includes('view') || this._inputs.some(v => v === 'view');
    }

    hasWidth(): boolean {
        return this.hasWidthImport() || this.hasWidthInput();
    }

    hasWidthInput(): boolean {
        return this._inputs.some(v => v === 'width');
    }

    hasWidthImport(): boolean {
        return !!this._imports.get(this.Runtime)?.locals.includes('width');
    }

    hasDisplay(): boolean {
        return this.hasImplicitDisplay() || this.hasExplicitDisplay() || this.hasExplicitView();
    }
}

