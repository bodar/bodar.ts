import {Imports, processImports} from "../javascript/Imports.ts";
import {parseScript, processJSX, toScript} from "../javascript/script-parsing.ts";
import {findUnresolvedReferences} from "../javascript/findUnresolvedReferences.ts";
import {findTopLevelVariableDeclarations} from "../javascript/findTopLevelVariableDeclarations.ts";
import {isSingleStatement, isSingleExpression} from "../javascript/isSingleExpression.ts";
import {type IdGenerator, SimpleHashGenerator} from "../IdGenerator.ts";

/** A definition of a Node but still in raw text format */
export class NodeDefinition {
    constructor(private _key: string,
                private _inputs: string[],
                private _outputs: string[],
                private _imports: Imports,
                private _singleExpression: boolean,
                private _singleStatement: boolean,
                private _body: string
    ) {
    }

    static parse(javascript: string, id?: string, idGenerator: IdGenerator = SimpleHashGenerator): NodeDefinition {
        const key = id || idGenerator.generate(javascript);
        try {
            const program = processJSX(parseScript(javascript));
            const inputs = findUnresolvedReferences(program);
            const outputs = findTopLevelVariableDeclarations(program);
            const imports = processImports(program);
            const singleExpression = isSingleExpression(program);
            const singleStatement = isSingleStatement(program);
            const newJavascript = toScript(program);
            return new NodeDefinition(key, inputs, [...outputs, ...imports.locals()], imports, singleExpression, singleStatement, newJavascript);
        } catch (error: any) {
            return (new NodeDefinition(key, [], [], Imports.empty, true, false, JSON.stringify(error.message)));
        }
    }

    get key(): string {
        return this._key;
    }

    get inputs(): string[] {
        return this._inputs.map(i => i === 'display' ? 'Display' : i === 'view' ? 'View' : i);
    }

    get outputs(): string[] {
        const transformed = this._outputs.map(o => o === 'display' ? 'Display' : o === 'view' ? 'View' :o);
        return [...transformed];
    }

    get imports(): Imports {
        return this._imports;
    }

    importsExpressions(): string {
        if (this._imports.isEmpty()) return "";

        const entries = Array.from(this._imports.data.entries());

        const specifierStrings = entries.map(([source, imp]) =>
            source.startsWith('@bodar/dataflow/') ?
                imp.specifier.replace(/\bdisplay\b/, 'Display').replace(/\bview\b/, 'View') :
                imp.specifier);

        const importStrings = entries.map(([source]) => `import('${source}')`);
        return `const [${specifierStrings.join(', ')}] = await Promise.all([${importStrings.join(', ')}]);`;
    }

    get body(): string {
        return [
            this.importsExpressions(),
            this.hasExplicitDisplay() ? `const display = Display.for(${JSON.stringify(this._key)});` : undefined,
            this.hasExplicitView() ? `const view = View.for(${JSON.stringify(this._key)});` : undefined,
            this.outputs.length ? `${this._body}\nreturn {${this.outputs.join(',')}};` : this._singleStatement ? this._body : `return ${this._body}`
        ].filter(l => l).join('\n');
    }

    isSingleExpression(): boolean {
        return this._singleExpression;
    }

    get arguments(): string {
        return `(${this.inputs.join(',')})`;
    }

    isLambda(): boolean {
        return this.isSingleExpression() && this.outputs.length === 0 && this.imports.isEmpty();
    }

    isAsync(): boolean {
        return !this.imports.isEmpty();
    }

    toString(): string {
        return `${JSON.stringify(this.key)},${JSON.stringify(this.inputs)},${JSON.stringify(this.outputs)},${this.fun()}`;
    }

    fun(): string {
        return `${this.isAsync() ? 'async' : ''}${this.arguments} => {\n${this.body}\n}`;
    }

    hasImplicitDisplay(): boolean {
        return this._singleExpression && !this.hasExplicitDisplay();
    }

    hasExplicitDisplay(): boolean {
        return !!this._imports.get('@bodar/dataflow/api/display.ts') || this._inputs.some(v => v === 'display');
    }

    hasExplicitView(): boolean {
        return !!this._imports.get('@bodar/dataflow/api/view.ts') || this._inputs.some(v => v === 'view');
    }

    hasDisplay(): boolean {
        return this.hasImplicitDisplay() || this.hasExplicitDisplay() || this.hasExplicitView();
    }
}

