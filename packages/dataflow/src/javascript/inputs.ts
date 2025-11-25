import type {Function as FunDef, Identifier} from "acorn";

export function getInputs(funDef: FunDef): string[] {
    return (funDef.params as Identifier[]).map(p => p.name);
}