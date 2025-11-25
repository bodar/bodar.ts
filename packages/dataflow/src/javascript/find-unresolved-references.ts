// Browser + Node globals
import type {Identifier, Node, Pattern, Program} from "acorn";
import {ancestor} from "acorn-walk";

const defaultGlobals = new Set([
    "Array", "Object", "String", "Number", "Boolean", "Math", "Date",
    "JSON", "console", "Promise", "Map", "Set", "RegExp", "Error",
    "document", "window", "fetch", "undefined", "Symbol", "BigInt",
    "ArrayBuffer", "Blob", "crypto", "URL", "TextEncoder", "TextDecoder",
    "Uint8Array", "Int32Array", "Float64Array", "DataView", "Reflect",
    "Proxy", "WeakMap", "WeakSet", "Infinity", "NaN", "isNaN", "isFinite",
    "parseInt", "parseFloat", "encodeURI", "decodeURI", "eval", "jsx", "jsx.createElement"
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