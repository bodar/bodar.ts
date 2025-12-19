import type {
    ImportDeclaration,
    ImportDefaultSpecifier,
    ImportNamespaceSpecifier,
    ImportSpecifier,
    Program
} from "acorn";

export class Import {
    constructor(public specifier: string, public locals: string[]) {
    }
}

export class Imports {
    constructor(public data: Map<string, Import>) {
    }

    static from(program: Program): Imports {
        return new Imports(new Map<string, Import>(program.body
            .filter(v => v.type === 'ImportDeclaration')
            .map((im: ImportDeclaration) => [
                String(im.source.value),
                this.handle(im.specifiers)
            ])));
    }

    static handle(specifiers: Array<ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier>): Import {
        if(specifiers.length === 0) throw new Error("No specifier specifiers found.");
        const first = specifiers[0];
        if(first.type === "ImportNamespaceSpecifier") return new Import(first.local.name, [first.local.name]);
        if(first.type === "ImportDefaultSpecifier") return new Import("{default:" + first.local.name + "}", [first.local.name]);
        return new Import(`{${specifiers.map(sp => sp.local.name).join(',')}}`,
            specifiers.map(sp => sp.local.name));
    }

    static empty: Imports = new Imports(new Map());

    get(source: string): Import | undefined {
        return this.data.get(source);
    }

    isEmpty(): boolean {
        return this.data.size === 0;
    }

    toString(): string {
        if (this.isEmpty()) return "";
        const specifierStrings = Array.from(this.data.values(), i => i.specifier);
        const importStrings = Array.from(this.data.keys().map(source => `import('${source}')`));
        return `const [${specifierStrings.join(', ')}] = await Promise.all([${importStrings.join(', ')}]);\n`;
    }

    locals(): string[] {
        return Array.from(this.data.values()).flatMap(i => i.locals)
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