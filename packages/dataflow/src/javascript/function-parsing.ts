import {type Expression, type Function as FunDef, parseExpressionAt} from "acorn";

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