import type {BlockStatement, Expression, Function as FunDef, Identifier, ObjectExpression, Property} from "acorn";

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