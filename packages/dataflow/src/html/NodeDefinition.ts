import {Imports, processImports} from "../javascript/Imports.ts";
import {parseScript, processJSX, toScript} from "../javascript/script-parsing.ts";
import {findUnresolvedReferences} from "../javascript/findUnresolvedReferences.ts";
import {findTopLevelVariableDeclarations} from "../javascript/findTopLevelVariableDeclarations.ts";
import {display} from "../api/display.ts";
import {isSingleExpression} from "../javascript/isSingleExpression.ts";
import {type IdGenerator, SimpleHashGenerator} from "../IdGenerator.ts";

/** A definition of a Node but still in raw text format */
export class NodeDefinition {
    constructor(private _key: string,
                private _inputs: string[],
                private _outputs: string[],
                private _imports: Imports,
                private _singleExpression: boolean,
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
            const newJavascript = toScript(program);
            return new NodeDefinition(key, inputs, [...outputs, ...imports.locals()], imports, singleExpression, newJavascript);
        } catch (error: any) {
            return (new NodeDefinition(key, [], [], Imports.empty, true, JSON.stringify(error.message)));
        }
    }

    get key(): string {
        return this.hasImplicitDisplay() ? display.format(this._key) : this._key;
    }

    get inputs(): string[] {
        return this._inputs;
    }

    get outputs(): string[] {
        return [...this._outputs, ...(this.hasExplicitDisplay() || this.hasExplicitView() ? [display.format(this.key)] : [])];
    }

    get returnStatement(): string {
        return `return {${this.outputs.join(',')}${this.hasExplicitDisplay() ? `:display.pop()` : this.hasExplicitView() ? `:view.pop()` : ''}};`;
    }

    get imports(): Imports {
        return this._imports;
    }

    get body(): string {
        if (this.isSingleExpression() && this._body.endsWith(';')) return this._body.slice(0, -1);
        return this.imports + this._body;
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
        if (this.isLambda()) return `${this.arguments} => ${this.body}`
        return `${this.isAsync() ? 'async' : ''}${this.arguments} => {\n${this.body}\n${this.returnStatement}\n}`;
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
}

