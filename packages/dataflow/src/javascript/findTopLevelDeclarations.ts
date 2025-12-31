import type {Program} from "acorn";

export function findTopLevelDeclarations(program: Program): string[] {
    const names: string[] = [];

    for (const node of program.body) {
        if (node.type === 'VariableDeclaration') {
            for (const decl of node.declarations) {
                if (decl.id.type === 'Identifier') names.push(decl.id.name);
            }
        } else if (node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') {
            if (node.id) names.push(node.id.name);
        }
    }

    return names;
}
