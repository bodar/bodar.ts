import {
    type BlockStatement,
    type Expression,
    type Function as FunDef,
    type Identifier,
    type ObjectExpression,
    parseExpressionAt,
    type Property
} from "acorn";

function findFunction(statement: Expression): FunDef | undefined {
    switch (statement.type) {
        case 'FunctionExpression':
            return statement;
        case 'ArrowFunctionExpression':
            return statement;
    }
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