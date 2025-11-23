import type {ImportDeclaration, Program} from "acorn";

export class Imports {
    constructor(private data: Map<string, string[]>) {
    }

    static from(program: Program): Imports {
        return new Imports(new Map<string, any>(program.body
            .filter(v => v.type === 'ImportDeclaration')
            .map((im: ImportDeclaration) => [
                String(im.source.value),
                im.specifiers.map(sp => sp.local.name)
            ])));
    }

    static empty = new Imports(new Map());

    get(source: string): string[] | undefined {
        return this.data.get(source);
    }

    isEmpty(): boolean {
        return this.data.size === 0;
    }

    toString(): string {
        if (this.isEmpty()) return "";
        const specifierStrings = Array.from(this.data.values().map(names => `{${names.join(',')}}`));
        const importStrings = Array.from(this.data.keys().map(source => `import('${source}')`));
        return `const [${specifierStrings.join(', ')}] = await Promise.all([${importStrings.join(', ')}]);\n`;
    }
}

export function removeImports(program: Program): Program {
    program.body = program.body.filter(v => v.type !== 'ImportDeclaration');
    return program;
}

export function processImports(program: Program): Imports {
    const imports = Imports.from(program);
    removeImports(program);
    return imports;
}