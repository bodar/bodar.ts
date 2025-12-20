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

    /** Remove a specifier by name, returns null if no specifiers remain */
    removeSpecifier(name: string): Import | null {
        const newLocals = this.locals.filter(l => l !== name);
        if (newLocals.length === 0) return null;
        const newSpecifier = `{${newLocals.join(',')}}`;
        return new Import(newSpecifier, newLocals);
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

    /** Clone this Imports instance */
    clone(): Imports {
        return new Imports(new Map(this.data));
    }

    /** Remove a specifier from a source, removes entire import if no specifiers remain */
    removeSpecifier(source: string, name: string): void {
        const imp = this.data.get(source);
        if (!imp) return;
        const newImp = imp.removeSpecifier(name);
        if (newImp) {
            this.data.set(source, newImp);
        } else {
            this.data.delete(source);
        }
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