import type {Program} from "acorn";
import {analyze} from "../scopes/analyze.ts";

export function findUnresolvedReferences(program: Program): string[] {
    return analyze(program);
}
