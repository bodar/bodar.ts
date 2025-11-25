import {Imports, processImports} from "../javascript/Imports.ts";
import {simpleHash} from "../simpleHash.ts";
import {
    parseScript,
    processJSX, toScript
} from "../javascript/script-parsing.ts";
import {findUnresolvedReferences} from "../javascript/findUnresolvedReferences.ts";
import {findTopLevelVariableDeclarations} from "../javascript/findTopLevelVariableDeclarations.ts";

/** A definition of a Node but still in raw text format */
export class NodeDefinition {
    constructor(public key: string,
                public inputs: string[],
                public outputs: string[],
                public imports: Imports,
                public body: string
    ) {
    }

    toString(): string {
        return `${JSON.stringify(this.key)},${JSON.stringify(this.inputs)},${JSON.stringify(this.outputs)},${this.fun()}`;
    }

    fun(): string {
        if (this.outputs.length === 0 && this.imports.isEmpty()) return `(${this.inputs.join(',')}) => ${this.body}`
        return `${!this.imports.isEmpty() ? 'async' : ''}(${this.inputs.join(',')}) => {
${this.body}
return {${this.outputs.join(',')}};
}`;
    }
}

export function parseNodeDefinition(javascript: string, id?: string): NodeDefinition {
    const key = id || simpleHash(javascript);
    try {
        const program = processJSX(parseScript(javascript));
        const inputs = findUnresolvedReferences(program);
        const outputs = findTopLevelVariableDeclarations(program);
        const imports = processImports(program);
        let newJavascript = toScript(program);
        newJavascript = imports + newJavascript;
        if (!javascript.match(/;\s*/) && newJavascript.match(/;\s*/)) newJavascript = newJavascript.slice(0, -1);
        return new NodeDefinition(key, inputs, outputs, imports, newJavascript);
    } catch (error: any) {
        return (new NodeDefinition(key, [], [], Imports.empty, JSON.stringify(error.message)));
    }
}