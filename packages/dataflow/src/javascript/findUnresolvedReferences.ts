import * as eslintScope from 'eslint-scope';
import type {Program} from "acorn";

export function findUnresolvedReferences(program: Program): string[] {
    const scopeManager = eslintScope.analyze(program as any, {
        ecmaVersion: 2022,
        sourceType: 'module'
    });

    const references = new Set<string>();

    for (const ref of scopeManager.globalScope.through) {
        const name = ref.identifier.name;
        if (!references.has(name)) {
            references.add(name);
        }
    }

    return Array.from(references);
}
