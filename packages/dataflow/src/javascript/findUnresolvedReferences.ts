import * as eslintScope from 'eslint-scope';
import type {Program} from "acorn";

export function findUnresolvedReferences(program: Program): string[] {
    const scopeManager = eslintScope.analyze(program as any, {
        ecmaVersion: 2022,
        sourceType: 'module'
    });

    const seen = new Set<string>();
    const references: string[] = [];

    for (const ref of scopeManager.globalScope.through) {
        const name = ref.identifier.name;
        if (!seen.has(name)) {
            seen.add(name);
            references.push(name);
        }
    }

    return references;
}
