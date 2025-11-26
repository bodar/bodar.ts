import type {Program} from "acorn";

export function isSingleExpression(program: Program): boolean {
    return program.body.length === 1 && program.body[0].type === 'ExpressionStatement';
}