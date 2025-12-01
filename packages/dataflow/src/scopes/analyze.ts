import type {Node, Program} from "acorn";
import {walk} from "../jsx-transform/walker.ts";
import {Scope} from "./Scope.ts";
import {extractBindings} from "./patterns.ts";

/**
 * Analyze a program and return all unresolved references (references to variables
 * not declared in any enclosing scope).
 */
export function analyze(program: Program): string[] {
    let scope = new Scope(null, true);
    const unresolved = new Set<string>();

    const pushScope = (isFunction: boolean) => {
        scope = scope.child(isFunction);
    };

    const popScope = () => {
        if (scope.parent) scope = scope.parent;
    };

    const addBinding = (name: string, kind: 'var' | 'let' | 'const' | 'function' | 'class' | 'import' | 'param' | 'catch') => {
        scope.addBinding(name, kind);
    };

    const addBindings = (names: string[], kind: 'var' | 'let' | 'const' | 'function' | 'class' | 'import' | 'param' | 'catch') => {
        for (const name of names) {
            addBinding(name, kind);
        }
    };

    const reference = (name: string) => {
        if (!scope.resolves(name)) {
            unresolved.add(name);
        }
    };

    const handleDeclaration = (node: any) => {
        const kind = node.kind as 'var' | 'let' | 'const';
        for (const decl of node.declarations) {
            addBindings(extractBindings(decl.id), kind);
        }
    };

    const handleFunctionParams = (node: any) => {
        for (const param of node.params || []) {
            addBindings(extractBindings(param), 'param');
        }
    };

    const handleImport = (node: any) => {
        for (const spec of node.specifiers || []) {
            addBinding(spec.local.name, 'import');
        }
    };

    const handleClass = (node: any) => {
        if (node.id) {
            addBinding(node.id.name, 'class');
        }
    };

    const handleCatch = (node: any) => {
        if (node.param) {
            addBindings(extractBindings(node.param), 'catch');
        }
    };

    const handleForInOf = (node: any) => {
        const left = node.left;
        if (left.type === "VariableDeclaration") {
            const kind = left.kind as 'var' | 'let' | 'const';
            for (const decl of left.declarations) {
                addBindings(extractBindings(decl.id), kind);
            }
        }
    };

    walk(program, {
        enter(node: Node, parent: Node | null) {
            const n = node as any;

            // Scope-creating nodes
            switch (n.type) {
                case "FunctionDeclaration":
                    if (n.id) addBinding(n.id.name, 'function');
                    pushScope(true);
                    handleFunctionParams(n);
                    return;

                case "FunctionExpression":
                    pushScope(true);
                    if (n.id) addBinding(n.id.name, 'function');
                    handleFunctionParams(n);
                    return;

                case "ArrowFunctionExpression":
                    pushScope(true);
                    handleFunctionParams(n);
                    return;

                case "BlockStatement":
                    if (parent && (
                        parent.type === "FunctionDeclaration" ||
                        parent.type === "FunctionExpression" ||
                        parent.type === "ArrowFunctionExpression"
                    )) return;
                    pushScope(false);
                    return;

                case "ForStatement":
                    pushScope(false);
                    return;

                case "ForInStatement":
                case "ForOfStatement":
                    pushScope(false);
                    handleForInOf(n);
                    return;

                case "CatchClause":
                    pushScope(false);
                    handleCatch(n);
                    return;

                case "ClassDeclaration":
                    handleClass(n);
                    pushScope(false);
                    return;

                case "ClassExpression":
                    pushScope(false);
                    if (n.id) addBinding(n.id.name, 'class');
                    return;

                case "SwitchStatement":
                    pushScope(false);
                    return;
            }

            // Declaration nodes
            switch (n.type) {
                case "VariableDeclaration":
                    handleDeclaration(n);
                    return;

                case "ImportDeclaration":
                    handleImport(n);
                    return;
            }

            // Reference nodes
            if (n.type === "Identifier") {
                if (!parent) return;

                const p = parent as any;

                // Property key in member expression
                if (p.type === "MemberExpression" && p.property === node && !p.computed) return;

                // Property key in object literal
                if (p.type === "Property" && p.key === node && !p.computed && !p.shorthand) return;

                // Declaration sites
                if (p.type === "VariableDeclarator" && p.id === node) return;
                if (p.type === "FunctionDeclaration" && p.id === node) return;
                if (p.type === "FunctionExpression" && p.id === node) return;
                if (p.type === "ClassDeclaration" && p.id === node) return;
                if (p.type === "ClassExpression" && p.id === node) return;
                if (p.type === "ImportSpecifier") return; // Both imported and local names
                if (p.type === "ImportDefaultSpecifier" && p.local === node) return;
                if (p.type === "ImportNamespaceSpecifier" && p.local === node) return;
                if (p.type === "CatchClause" && p.param === node) return;

                // Assignment pattern left side
                if (p.type === "AssignmentPattern" && p.left === node) return;

                // Inside destructuring pattern
                if (p.type === "ArrayPattern" || p.type === "ObjectPattern" || p.type === "RestElement") return;

                // Labels
                if (p.type === "LabeledStatement" && p.label === node) return;
                if (p.type === "BreakStatement" && p.label === node) return;
                if (p.type === "ContinueStatement" && p.label === node) return;

                // Method/property definition key (non-computed only)
                if (p.type === "MethodDefinition" && p.key === node && !p.computed) return;
                if (p.type === "PropertyDefinition" && p.key === node && !p.computed) return;

                // Export specifiers
                if (p.type === "ExportSpecifier") return;

                reference(n.name);
            }
        },

        leave(node: Node, parent: Node | null) {
            const n = node as any;

            switch (n.type) {
                case "FunctionDeclaration":
                case "FunctionExpression":
                case "ArrowFunctionExpression":
                case "ForStatement":
                case "ForInStatement":
                case "ForOfStatement":
                case "CatchClause":
                case "ClassDeclaration":
                case "ClassExpression":
                case "SwitchStatement":
                    popScope();
                    return;

                case "BlockStatement":
                    if (parent && (
                        parent.type === "FunctionDeclaration" ||
                        parent.type === "FunctionExpression" ||
                        parent.type === "ArrowFunctionExpression"
                    )) return;
                    popScope();
                    return;
            }
        }
    });

    return Array.from(unresolved);
}
