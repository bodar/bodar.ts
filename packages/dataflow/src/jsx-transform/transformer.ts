import type {Expression, Node, Program} from "acorn";
import type {
    JSXElement,
    JSXFragment,
    JSXIdentifier,
    JSXMemberExpression,
    JSXAttribute,
    JSXSpreadAttribute,
    JSXChild,
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
    /** Prefix for call sites, so JSX from different modules never shares a site (blocks use the bare offset) */
    sitePrefix?: string;
}

const defaultOptions: Required<TransformOptions> = {
    factory: "jsx.element",
    sitePrefix: ""
};

const site = (node: Node, prefix: string): Expression => literal(prefix ? `${prefix}@${node.start}` : node.start);

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

function transformElement(node: JSXElement, factory: string, prefix: string): Expression {
    const {name, attributes} = node.openingElement;
    return callExpression(memberExpression(factory), [
        site(node, prefix),
        transformName(name as JSXIdentifier | JSXMemberExpression),
        attributes.length > 0 ? transformAttributes(attributes as Array<JSXAttribute | JSXSpreadAttribute>) : literal(null),
        ...transformChildren(node.children)]);
}

function transformFragment(node: JSXFragment, factory: string, prefix: string): Expression {
    return callExpression(memberExpression(factory), [site(node, prefix), literal(null), literal(null), ...transformChildren(node.children)]);
}

/** Text stays a string; every other child is a thunk, so its parent is claimed before it runs.
 *  A child that awaits or yields can't be deferred: it is evaluated eagerly, wrapped in an array. */
function transformChildren(children: JSXChild[]): Expression[] {
    return children.flatMap(child => {
        if (child.type === "JSXText") return [literal(child.value)];
        const expression = child.type === "JSXExpressionContainer" || child.type === "JSXSpreadChild" ? child.expression : child;
        if (expression.type === "JSXEmptyExpression") return [];
        return [suspends(expression) ? arrayExpression([expression as Expression]) : thunk(expression as Expression)];
    });
}

function suspends(expression: Node): boolean {
    let found = false;
    walk(expression, {
        enter(node) {
            if (node.type === "AwaitExpression" || node.type === "YieldExpression") found = true;
            if (node.type.includes("Function")) this.skip();
        }
    });
    return found;
}

function thunk(body: Expression): Expression {
    return {type: "ArrowFunctionExpression", id: null, params: [], body, expression: true, async: false, generator: false, start: 0, end: 0} as Expression;
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
                    this.replace(transformElement(anyNode as JSXElement, opts.factory, opts.sitePrefix));
                    return;
                case "JSXFragment":
                    this.replace(transformFragment(anyNode as JSXFragment, opts.factory, opts.sitePrefix));
                    return;
            }
        }
    });

    return program;
}
