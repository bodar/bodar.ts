import {type ExpressionStatement, type Function as FunDef, type Identifier, parse, type Property} from "acorn";

export function parseFunction(fun: Function): FunDef {
    const parsed = parse(fun.toString(), {ecmaVersion: 'latest'});
    return ((parsed.body[0]) as ExpressionStatement).expression as FunDef;
}

export function getInputs(funDef: FunDef): string[] {
    return (funDef.params as Identifier[]).map(p => p.name);
}

export function getOutputs(definition: FunDef): string[] {
    const findObjectExpression = () => {
        switch (definition.body.type) {
            case 'ObjectExpression':
                return definition.body;
            case 'BlockStatement': {
                const returnStatement = definition.body.body.find(s => s.type === 'ReturnStatement');
                if (returnStatement && returnStatement.argument?.type === 'ObjectExpression') return returnStatement.argument;
            }
        }
    };

    return (findObjectExpression()?.properties as Property[]).map((p) => (p.key as Identifier).name);
}