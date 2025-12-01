import type {
    Expression,
    Identifier,
    Literal,
    Property,
    SpreadElement,
    CallExpression,
    MemberExpression,
    ObjectExpression,
    ArrayExpression
} from "acorn";

export function identifier(name: string): Identifier {
    return {type: "Identifier", name, start: 0, end: 0};
}

export function literal(value: string | number | boolean | null): Literal {
    return {type: "Literal", value, start: 0, end: 0};
}

export function memberExpression(path: string): Expression {
    const parts = path.split('.');
    return parts.slice(1).reduce<Expression>(
        (object, name): MemberExpression => ({
            type: "MemberExpression",
            object,
            property: identifier(name),
            computed: false,
            optional: false,
            start: 0,
            end: 0
        }),
        identifier(parts[0])
    );
}

export function callExpression(callee: Expression, args: Expression[]): CallExpression {
    return {type: "CallExpression", callee, arguments: args, optional: false, start: 0, end: 0};
}

export function property(key: Identifier | Literal, value: Expression): Property {
    return {type: "Property", method: false, shorthand: false, computed: false, key, value, kind: "init", start: 0, end: 0};
}

export function spreadElement(argument: Expression): SpreadElement {
    return {type: "SpreadElement", argument, start: 0, end: 0};
}

export function objectExpression(properties: Array<Property | SpreadElement>): ObjectExpression {
    return {type: "ObjectExpression", properties, start: 0, end: 0};
}

export function arrayExpression(elements: Array<Expression | null>): ArrayExpression {
    return {type: "ArrayExpression", elements, start: 0, end: 0};
}
