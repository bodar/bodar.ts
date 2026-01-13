import {Imports, processImports} from "../javascript/Imports.ts";
import {parseScript, processJSX, toScript} from "../javascript/script-parsing.ts";
import {findUnresolvedReferences} from "../javascript/findUnresolvedReferences.ts";
import {findTopLevelDeclarations} from "../javascript/findTopLevelDeclarations.ts";
import {isSingleExpression} from "../javascript/isSingleExpression.ts";
import {hasTopLevelAwait} from "../javascript/findTopLevelAwaits.ts";

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

    static parse(javascript: string, key: string): NodeDefinition {
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

    isAsync(): boolean {
        return !this.getImports().isEmpty() || this._hasTopLevelAwait;
    }

    toString(): string {
        const inputs = this.getInputs();
        const outputs = this.getOutputs();
        return `${JSON.stringify(this.key)},${JSON.stringify(inputs)},${JSON.stringify(outputs)},${this.fun()}`;
    }

    toFunction(): Function {
        if (this.isAsync()) return new AsyncFunction(...this.inputs, this.body());
        return new Function(...this.inputs, this.body());
    }

    fun(): string {
        const inputs = this.getInputs();
        return `${this.isAsync() ? 'async' : ''}(${inputs.join(',')}) => {\n${this.body()}\n}`;
    }

    private getInputs(): string[] {
        let inputs = this._inputs;
        // Strip display/view - accessed via _runtime_.Display/_runtime_.View
        inputs = inputs.filter(i => i !== 'display' && i !== 'view');
        // Map width to the per-node width stream
        inputs = inputs.map(i => i === 'width' ? `width_${this.key}` : i);
        return inputs;
    }

    private getOutputs(): string[] {
        return this._outputs.filter(o => o !== 'display' && o !== 'view' && o !== 'width');
    }

    private getImports(): Imports {
        const imports = this._imports.clone();
        imports.removeSpecifier(this.Runtime, 'display');
        imports.removeSpecifier(this.Runtime, 'view');
        imports.removeSpecifier(this.Runtime, 'width');
        return imports;
    }

    body(): string {
        const imports = this.getImports();
        const outputs = this.getOutputs();
        return [
            this.importsExpressions(imports),
            this.hasImplicitDisplay() || this.hasExplicitDisplay() || this.hasExplicitView() ? `const display = _runtime_.Display.for(${JSON.stringify(this._key)}, _runtime_);` : undefined,
            this.hasExplicitView() ? `const view = _runtime_.View.for(display);` : undefined,
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

const AsyncFunction = Object.getPrototypeOf(async function () {
}).constructor;
