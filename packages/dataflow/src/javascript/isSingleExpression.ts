import type {Program} from "acorn";

export function isSingleExpression(program: Program): boolean {
    return program.body.length === 1 && program.body[0].type === 'ExpressionStatement';
}

export function isSingleStatement(program: Program): boolean {
    return program.body.length === 1 && program.body[0].type.endsWith('Statement') && program.body[0].type !== 'ExpressionStatement';
}