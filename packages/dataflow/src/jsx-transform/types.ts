import type {Expression, Node} from "acorn";

export interface JSXIdentifier extends Node {
    type: "JSXIdentifier";
    name: string;
}

export interface JSXMemberExpression extends Node {
    type: "JSXMemberExpression";
    object: JSXMemberExpression | JSXIdentifier;
    property: JSXIdentifier;
}

export interface JSXNamespacedName extends Node {
    type: "JSXNamespacedName";
    namespace: JSXIdentifier;
    name: JSXIdentifier;
}

export interface JSXEmptyExpression extends Node {
    type: "JSXEmptyExpression";
}

export interface JSXExpressionContainer extends Node {
    type: "JSXExpressionContainer";
    expression: Expression | JSXEmptyExpression;
}

export interface JSXSpreadChild extends Node {
    type: "JSXSpreadChild";
    expression: Expression;
}

export interface JSXAttribute extends Node {
    type: "JSXAttribute";
    name: JSXIdentifier | JSXNamespacedName;
    value: JSXExpressionContainer | JSXElement | JSXFragment | Literal | null;
}

export interface JSXSpreadAttribute extends Node {
    type: "JSXSpreadAttribute";
    argument: Expression;
}

export interface JSXOpeningElement extends Node {
    type: "JSXOpeningElement";
    name: JSXIdentifier | JSXMemberExpression | JSXNamespacedName;
    attributes: Array<JSXAttribute | JSXSpreadAttribute>;
    selfClosing: boolean;
}

export interface JSXClosingElement extends Node {
    type: "JSXClosingElement";
    name: JSXIdentifier | JSXMemberExpression | JSXNamespacedName;
}

export interface JSXElement extends Node {
    type: "JSXElement";
    openingElement: JSXOpeningElement;
    closingElement: JSXClosingElement | null;
    children: JSXChild[];
}

export interface JSXOpeningFragment extends Node {
    type: "JSXOpeningFragment";
}

export interface JSXClosingFragment extends Node {
    type: "JSXClosingFragment";
}

export interface JSXFragment extends Node {
    type: "JSXFragment";
    openingFragment: JSXOpeningFragment;
    closingFragment: JSXClosingFragment;
    children: JSXChild[];
}

export interface JSXText extends Node {
    type: "JSXText";
    value: string;
    raw: string;
}

export type JSXChild = JSXElement | JSXFragment | JSXText | JSXExpressionContainer | JSXSpreadChild;

export type JSXNode =
    | JSXElement
    | JSXFragment
    | JSXText
    | JSXExpressionContainer
    | JSXSpreadChild
    | JSXIdentifier
    | JSXMemberExpression
    | JSXNamespacedName
    | JSXAttribute
    | JSXSpreadAttribute
    | JSXOpeningElement
    | JSXClosingElement
    | JSXOpeningFragment
    | JSXClosingFragment
    | JSXEmptyExpression;

export type AnyNode = Node | JSXNode;

interface Literal extends Node {
    type: "Literal";
    value: string | number | boolean | null | RegExp | bigint;
    raw?: string;
}
