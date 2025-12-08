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

function transformName(name: JSXIdentifier | JSXMemberExpression): Expression {
    if (name.type === "JSXIdentifier") {
        return isCapitalLetter(name.name[0]) ? identifier(name.name) : literal(name.name);
    }
    if (name.type === "JSXMemberExpression") {
        return transformMemberExpression(name);
    }
    throw new Error(`Unknown name type: ${(name as any).type}`);
}

function transformMemberExpression(expr: JSXMemberExpression): Expression {
    const object = expr.object.type === "JSXMemberExpression"
        ? transformMemberExpression(expr.object)
        : identifier(expr.object.name);

    return {
        type: "MemberExpression",
        object,
        property: identifier(expr.property.name),
        computed: false,
        optional: false,
        start: 0,
        end: 0
    } as Expression;
}

function transformAttributes(attributes: Array<JSXAttribute | JSXSpreadAttribute>): Expression {
    const properties = attributes.map(attr => {
        if (attr.type === "JSXSpreadAttribute") {
            return spreadElement(attr.argument);
        }

        const key = literal(attr.name.type === "JSXIdentifier" ? attr.name.name : `${attr.name.namespace.name}:${attr.name.name}`);

        if (!attr.value) {
            return property(key, literal(true));
        }

        if (attr.value.type === "Literal") {
            return property(key, attr.value as unknown as Expression);
        }

        if (attr.value.type === "JSXExpressionContainer") {
            return property(key, attr.value.expression as Expression);
        }

        throw new Error(`Unknown attribute value type: ${attr.value.type}`);
    });

    return objectExpression(properties);
}

function transformElement(node: JSXElement, factory: string): Expression {
    const {name, attributes} = node.openingElement;
    const children = node.children;

    const args: Expression[] = [transformName(name as JSXIdentifier | JSXMemberExpression)];

    args.push(attributes.length > 0
        ? transformAttributes(attributes as Array<JSXAttribute | JSXSpreadAttribute>)
        : literal(null));

    if (children.length > 0) {
        args.push(arrayExpression(children as unknown as Expression[]));
    }

    return callExpression(memberExpression(factory), args);
}

function transformFragment(node: JSXFragment, factory: string): Expression {
    const args: Expression[] = [literal(null), literal(null)];

    if (node.children.length > 0) {
        args.push(arrayExpression(node.children as unknown as Expression[]));
    }

    return callExpression(memberExpression(factory), args);
}

export function transformJSX(program: Program, options?: TransformOptions): Program {
    const opts = {...defaultOptions, ...options};

    walk(program, {
        enter(node) {
            const anyNode = node as AnyNode;

            switch (anyNode.type) {
                case "JSXText":
                    this.replace(literal((anyNode as any).value));
                    return;
                case "JSXExpressionContainer":
                    this.replace((anyNode as any).expression);
                    return;
                case "JSXMemberExpression":
                    this.replace(transformMemberExpression(anyNode as JSXMemberExpression));
                    return;
                case "JSXIdentifier":
                    this.replace(identifier((anyNode as any).name));
                    return;
                case "JSXElement":
                    this.replace(transformElement(anyNode as JSXElement, opts.factory));
                    return;
                case "JSXFragment":
                    this.replace(transformFragment(anyNode as JSXFragment, opts.factory));
                    return;
            }
        }
    });

    return program;
}
