import type {Expression, Program} from "acorn";
import type {
    JSXElement,
    JSXFragment,
    JSXIdentifier,
    JSXMemberExpression,
    JSXAttribute,
    JSXSpreadAttribute,
    AnyNode
} from "./types.ts";
import {
    identifier,
    literal,
    memberExpression,
    callExpression,
    property,
    spreadElement,
    objectExpression,
    arrayExpression
} from "./nodes.ts";
import {walk} from "./walker.ts";

export interface TransformOptions {
    factory?: string;
}

const defaultOptions: Required<TransformOptions> = {
    factory: "jsx.createElement"
};

function isCapitalLetter(char: string): boolean {
    return char !== char.toLowerCase();
}

function transformName(name: JSXIdentifier | JSXMemberExpression, range?: [number, number]): Expression {
    if (name.type === "JSXIdentifier") {
        return isCapitalLetter(name.name[0])
            ? identifier(name.name, range)
            : literal(name.name, range);
    }

    if (name.type === "JSXMemberExpression") {
        return transformMemberExpression(name, range);
    }

    throw new Error(`Unknown name type: ${(name as any).type}`);
}

function transformMemberExpression(expr: JSXMemberExpression, range?: [number, number]): Expression {
    const object = expr.object.type === "JSXMemberExpression"
        ? transformMemberExpression(expr.object, range)
        : identifier(expr.object.name, range);

    return {
        type: "MemberExpression",
        object,
        property: identifier(expr.property.name),
        computed: false,
        optional: false,
        start: expr.start,
        end: expr.end,
        range
    } as Expression;
}

function transformAttributes(
    attributes: Array<JSXAttribute | JSXSpreadAttribute>,
    range?: [number, number]
): Expression {
    const properties = attributes.map(attr => {
        if (attr.type === "JSXSpreadAttribute") {
            return spreadElement(attr.argument, range);
        }

        const key = literal(attr.name.type === "JSXIdentifier" ? attr.name.name : `${attr.name.namespace.name}:${attr.name.name}`, range);

        if (!attr.value) {
            return property(key, literal(true, range), range);
        }

        if (attr.value.type === "Literal") {
            return property(key, attr.value as unknown as Expression, range);
        }

        if (attr.value.type === "JSXExpressionContainer") {
            return property(key, attr.value.expression as Expression, range);
        }

        throw new Error(`Unknown attribute value type: ${attr.value.type}`);
    });

    return objectExpression(properties, range);
}

function transformElement(node: JSXElement, factory: string): Expression {
    const range = node.range;
    const {name, attributes} = node.openingElement;
    const children = node.children;

    const args: Expression[] = [
        transformName(name as JSXIdentifier | JSXMemberExpression, range)
    ];

    if (attributes.length > 0) {
        args.push(transformAttributes(attributes as Array<JSXAttribute | JSXSpreadAttribute>, range));
    } else {
        args.push(literal(null, range));
    }

    if (children.length > 0) {
        args.push(arrayExpression(children as unknown as Expression[], range));
    }

    return callExpression(memberExpression(factory, range), args, range);
}

function transformFragment(node: JSXFragment, factory: string): Expression {
    const range = node.range;
    const children = node.children;

    const args: Expression[] = [
        literal(null, range),
        literal(null, range)
    ];

    if (children.length > 0) {
        args.push(arrayExpression(children as unknown as Expression[], range));
    }

    return callExpression(memberExpression(factory, range), args, range);
}

export function transformJSX(program: Program, options?: TransformOptions): Program {
    const opts = {...defaultOptions, ...options};

    walk(program, {
        enter(node) {
            const anyNode = node as AnyNode;

            if (anyNode.type === "JSXText") {
                const value = (anyNode as any).value as string;
                if (/^[ \t]*[\r\n][ \t\r\n]*$/.test(value)) {
                    this.remove();
                } else {
                    const trimmed = value.replace(/^\s+/, "").replace(/\s+$/, "");
                    this.replace(literal(trimmed, anyNode.range));
                }
                return;
            }

            if (anyNode.type === "JSXExpressionContainer") {
                this.replace((anyNode as any).expression);
                return;
            }

            if (anyNode.type === "JSXMemberExpression") {
                this.replace(transformMemberExpression(anyNode as JSXMemberExpression, anyNode.range));
                return;
            }

            if (anyNode.type === "JSXIdentifier") {
                this.replace(identifier((anyNode as any).name, anyNode.range));
                return;
            }

            if (anyNode.type === "JSXElement") {
                this.replace(transformElement(anyNode as JSXElement, opts.factory));
                return;
            }

            if (anyNode.type === "JSXFragment") {
                this.replace(transformFragment(anyNode as JSXFragment, opts.factory));
                return;
            }
        }
    });

    return program;
}
