import type {Program} from "acorn";
import {walk} from "../jsx-transform/walker.ts";

export function hasTopLevelAwait(program: Program): boolean {
    let found = false;

    walk(program, {
        enter(node) {
            if (found) {
                this.skip();
                return;
            }

            // Stop at function boundaries - await inside these doesn't count as top-level
            if (node.type === 'FunctionDeclaration' ||
                node.type === 'FunctionExpression' ||
                node.type === 'ArrowFunctionExpression' ||
                node.type === 'MethodDefinition') {
                this.skip();
                return;
            }

            // await expression
            if (node.type === 'AwaitExpression') {
                found = true;
                this.skip();
                return;
            }

            // for await...of
            if (node.type === 'ForOfStatement' && (node as any).await) {
                found = true;
                this.skip();
                return;
            }

            // await using
            if (node.type === 'VariableDeclaration' && (node as any).await) {
                found = true;
                this.skip();
                return;
            }
        }
    });

    return found;
}
