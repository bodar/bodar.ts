import {
    type BlockStatement,
    type Expression,
    type Function as FunDef,
    type Identifier,
    type Node,
    type ObjectExpression,
    parseExpressionAt,
    Parser,
    type Pattern,
    type Program,
    type Property
} from "acorn";
import {ancestor} from "acorn-walk";
import jsx from "acorn-jsx";
import {generate} from "astring";
// @ts-ignore
import transform from "mxn-jsx-ast-transformer";

function findFunction(statement: Expression): FunDef | undefined {
    switch (statement.type) {
        case 'FunctionExpression':
            return statement;
        case 'ArrowFunctionExpression':
            return statement;
    }
}

export function parseScript(javascript: string): Program {
    return Parser.extend(jsx()).parse(javascript, {ecmaVersion: "latest"});
}

export function processJSX(program: Program): string {
    const ast = transform(program, {factory: "jsx.createElement"});
    return generate(ast, {indent: "", lineEnd: "", comments: false});
}

export function findTopLevelVariableDeclarations(program: Program): string[] {
    const variables = program.body.filter(v => v.type === 'VariableDeclaration');
    return variables.flatMap(v => v.declarations)
        .map(d => d.id.type === 'Identifier' ? d.id.name : '')
}

export function parseFunction(fun: Function): FunDef {
    const parsed = parseExpressionAt(fun.toString(), 0, {ecmaVersion: 'latest'});

    const definition = findFunction(parsed);
    if (!definition) throw new Error(`Unable to parse function: ${fun}`);
    return definition
}

export function getInputs(funDef: FunDef): string[] {
    return (funDef.params as Identifier[]).map(p => p.name);
}

function findObjectExpression(body: BlockStatement | Expression): ObjectExpression | undefined {
    switch (body.type) {
        case 'ObjectExpression':
            return body;
        case 'BlockStatement': {
            const returnStatement = body.body.find(s => s.type === 'ReturnStatement');
            if (returnStatement && returnStatement.argument?.type === 'ObjectExpression') return returnStatement.argument;
        }
    }
}

export function getOutputs(definition: FunDef): string[] {
    const objectExpression = findObjectExpression(definition.body);
    if (!objectExpression) return [];

    return (objectExpression.properties as Property[]).map((p) => (p.key as Identifier).name);
}

// Browser + Node globals
const defaultGlobals = new Set([
    "Array", "Object", "String", "Number", "Boolean", "Math", "Date",
    "JSON", "console", "Promise", "Map", "Set", "RegExp", "Error",
    "document", "window", "fetch", "undefined", "Symbol", "BigInt",
    "ArrayBuffer", "Blob", "crypto", "URL", "TextEncoder", "TextDecoder",
    "Uint8Array", "Int32Array", "Float64Array", "DataView", "Reflect",
    "Proxy", "WeakMap", "WeakSet", "Infinity", "NaN", "isNaN", "isFinite",
    "parseInt", "parseFloat", "encodeURI", "decodeURI", "eval"
]);

function isScope(node: Node): boolean {
    return (
        node.type === "FunctionExpression" ||
        node.type === "FunctionDeclaration" ||
        node.type === "ArrowFunctionExpression" ||
        node.type === "Program"
    );
}

function isBlockScope(node: Node): boolean {
    return (
        node.type === "BlockStatement" ||
        node.type === "ForInStatement" ||
        node.type === "ForOfStatement" ||
        node.type === "ForStatement" ||
        isScope(node)
    );
}

function declarePattern(
    node: Pattern,
    parent: Node,
    locals: Map<Node, Set<string>>
): void {
    const declareLocal = (node: Node, name: string) => {
        const l = locals.get(node);
        if (l) l.add(name);
        else locals.set(node, new Set([name]));
    };

    switch (node.type) {
        case "Identifier":
            declareLocal(parent, node.name);
            break;
        case "ObjectPattern":
            node.properties.forEach((prop) =>
                declarePattern(prop.type === "Property" ? prop.value : prop, parent, locals)
            );
            break;
        case "ArrayPattern":
            node.elements.forEach((el) => el && declarePattern(el, parent, locals));
            break;
        case "RestElement":
            declarePattern(node.argument, parent, locals);
            break;
        case "AssignmentPattern":
            declarePattern(node.left, parent, locals);
            break;
    }
}

export function findUnresolvedReferences(program: Program): string[] {
    const locals = new Map<Node, Set<string>>();
    const references: string[] = [];

    // First pass: collect all declarations
    ancestor(program, {
        VariableDeclaration(node: any, _state: any, parents: Node[]) {
            let parent: Node | null = null;
            for (let i = parents.length - 1; i >= 0 && !parent; i--) {
                if (node.kind === "var" ? isScope(parents[i]) : isBlockScope(parents[i])) {
                    parent = parents[i];
                }
            }
            node.declarations.forEach((decl: any) =>
                declarePattern(decl.id, parent!, locals)
            );
        },
        FunctionDeclaration(node: any, _state: any, parents: Node[]) {
            // Declare function name in parent scope
            for (let i = parents.length - 2; i >= 0; i--) {
                if (isScope(parents[i])) {
                    const l = locals.get(parents[i]);
                    if (l && node.id) l.add(node.id.name);
                    else if (node.id) locals.set(parents[i], new Set([node.id.name]));
                    break;
                }
            }
            // Declare params in function scope
            if (!locals.has(node)) locals.set(node, new Set());
            node.params.forEach((param: Pattern) => declarePattern(param, node, locals));
            if (node.id) {
                const l = locals.get(node)!;
                l.add(node.id.name);
            }
        },
        FunctionExpression(node: any) {
            if (!locals.has(node)) locals.set(node, new Set());
            node.params.forEach((param: Pattern) => declarePattern(param, node, locals));
        },
        ArrowFunctionExpression(node: any) {
            if (!locals.has(node)) locals.set(node, new Set());
            node.params.forEach((param: Pattern) => declarePattern(param, node, locals));
        },
        ImportDeclaration(node: any, _state: any, parents: Node[]) {
            const root = parents[0];
            node.specifiers.forEach((spec: any) => {
                const l = locals.get(root);
                if (l) l.add(spec.local.name);
                else locals.set(root, new Set([spec.local.name]));
            });
        }
    });

    // Second pass: find unresolved identifiers
    const seen = new Set<string>();

    ancestor(program, {
        Identifier(node: Identifier, _state: any, parents: Node[]) {
            const name = node.name;
            if (name === "undefined" || defaultGlobals.has(name)) return;

            // Check if declared in any parent scope
            for (let i = parents.length - 2; i >= 0; i--) {
                const l = locals.get(parents[i]);
                if (l?.has(name)) return;
            }

            // Unresolved reference
            if (!seen.has(name)) {
                seen.add(name);
                references.push(name);
            }
        }
    });

    return references;
}