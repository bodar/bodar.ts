import type {Program} from "acorn";

export function findTopLevelVariableDeclarations(program: Program): string[] {
    const variables = program.body.filter(v => v.type === 'VariableDeclaration');
    return variables.flatMap(v => v.declarations)
        .map(d => d.id.type === 'Identifier' ? d.id.name : '')
}