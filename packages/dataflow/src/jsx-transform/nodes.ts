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

export function identifier(name: string, range?: [number, number]): Identifier {
    const node: Identifier = {type: "Identifier", name, start: 0, end: 0};
    if (range) node.range = range;
    return node;
}

export function literal(value: string | number | boolean | null, range?: [number, number]): Literal {
    const node: Literal = {type: "Literal", value, start: 0, end: 0};
    if (range) node.range = range;
    return node;
}

export function memberExpression(path: string, range?: [number, number]): Expression {
    const parts = path.split('.');
    return parts.slice(1).reduce<Expression>(
        (object, name) => {
            const node: MemberExpression = {
                type: "MemberExpression",
                object,
                property: identifier(name),
                computed: false,
                optional: false,
                start: 0,
                end: 0
            };
            if (range) node.range = range;
            return node;
        },
        identifier(parts[0], range)
    );
}

export function callExpression(callee: Expression, args: Expression[], range?: [number, number]): CallExpression {
    const node: CallExpression = {
        type: "CallExpression",
        callee,
        arguments: args,
        optional: false,
        start: 0,
        end: 0
    };
    if (range) node.range = range;
    return node;
}

export function property(key: Identifier | Literal, value: Expression, range?: [number, number]): Property {
    const node: Property = {
        type: "Property",
        method: false,
        shorthand: false,
        computed: false,
        key,
        value,
        kind: "init",
        start: 0,
        end: 0
    };
    if (range) node.range = range;
    return node;
}

export function spreadElement(argument: Expression, range?: [number, number]): SpreadElement {
    const node: SpreadElement = {
        type: "SpreadElement",
        argument,
        start: 0,
        end: 0
    };
    if (range) node.range = range;
    return node;
}

export function objectExpression(properties: Array<Property | SpreadElement>, range?: [number, number]): ObjectExpression {
    const node: ObjectExpression = {
        type: "ObjectExpression",
        properties,
        start: 0,
        end: 0
    };
    if (range) node.range = range;
    return node;
}

export function arrayExpression(elements: Array<Expression | null>, range?: [number, number]): ArrayExpression {
    const node: ArrayExpression = {
        type: "ArrayExpression",
        elements,
        start: 0,
        end: 0
    };
    if (range) node.range = range;
    return node;
}
