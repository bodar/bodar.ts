import {Parser, type Program} from "acorn";
import jsx from "acorn-jsx";
import {generate} from "astring";
// @ts-ignore
import transform from "mxn-jsx-ast-transformer";

export function parseScript(javascript: string): Program {
    return Parser.extend(jsx()).parse(javascript, {ecmaVersion: "latest", sourceType: "module", ranges: true});
}

export function processJSX(program: Program, factory: string = "jsx.createElement"): Program {
    return transform(program, {factory});
}

export function toScript(program: Program): string {
    return generate(program, {indent: "", lineEnd: "", comments: false});
}

