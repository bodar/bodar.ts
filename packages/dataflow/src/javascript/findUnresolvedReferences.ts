import * as eslintScope from 'eslint-scope';
import type {Program} from "acorn";

const defaultGlobals = new Set([
    "Array", "Object", "String", "Number", "Boolean", "Math", "Date",
    "JSON", "console", "Promise", "Map", "Set", "RegExp", "Error",
    "document", "window", "fetch", "undefined", "Symbol", "BigInt",
    "ArrayBuffer", "Blob", "crypto", "URL", "TextEncoder", "TextDecoder",
    "Uint8Array", "Int32Array", "Float64Array", "DataView", "Reflect",
    "Proxy", "WeakMap", "WeakSet", "Infinity", "NaN", "isNaN", "isFinite",
    "parseInt", "parseFloat", "encodeURI", "decodeURI", "eval"
]);

export function findUnresolvedReferences(program: Program): string[] {
    const scopeManager = eslintScope.analyze(program as any, {
        ecmaVersion: 2022,
        sourceType: 'module'
    });

    const seen = new Set<string>();
    const references: string[] = [];

    for (const ref of scopeManager.globalScope.through) {
        const name = ref.identifier.name;
        if (!defaultGlobals.has(name) && !seen.has(name)) {
            seen.add(name);
            references.push(name);
        }
    }

    return references;
}
