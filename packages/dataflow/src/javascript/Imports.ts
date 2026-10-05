import type {ImportDeclaration, ImportSpecifier, Program} from "acorn";

/** One dynamic import: the module source and the pattern its namespace is destructured into */
export class Import {
    constructor(public source: string, public specifier: string, public locals: string[]) {
    }
}

/** A block's static imports, one entry per import (a default + namespace import needs two) */
export class Imports {
    constructor(public data: Import[]) {
    }

    static from(program: Program): Imports {
        return new Imports(program.body
            .filter(v => v.type === 'ImportDeclaration')
            .flatMap(im => this.handle(im as ImportDeclaration)));
    }

    static handle(declaration: ImportDeclaration): Import[] {
        const source = String(declaration.source.value);
        const namespace = declaration.specifiers.find(sp => sp.type === 'ImportNamespaceSpecifier');
        const fields = declaration.specifiers.filter(sp => sp.type !== 'ImportNamespaceSpecifier');
        const pattern = new Import(source, `{${fields.map(sp => sp.type === 'ImportDefaultSpecifier'
            ? `default:${sp.local.name}` : field(sp))}}`, fields.map(sp => sp.local.name));
        if (!namespace) return [pattern];
        const whole = new Import(source, namespace.local.name, [namespace.local.name]);
        return fields.length ? [whole, pattern] : [whole];
    }

    static empty: Imports = new Imports([]);

    get(source: string): Import | undefined {
        return this.data.find(i => i.source === source);
    }

    isEmpty(): boolean {
        return this.data.length === 0;
    }

    /** Hoists every import into one awaited Promise.all, destructured into the block's locals */
    toString(): string {
        if (this.isEmpty()) return "";
        return `const [${this.data.map(i => i.specifier).join(', ')}] = await Promise.all([${this.data.map(i => `import('${i.source}')`).join(', ')}]);\n`;
    }

    locals(): string[] {
        return this.data.flatMap(i => i.locals);
    }
}

/** `a` or, when renamed, `a:b` (a string export name is quoted: `"a-b":b`) */
function field(specifier: ImportSpecifier): string {
    const imported = specifier.imported.type === 'Identifier' ? specifier.imported.name : JSON.stringify(specifier.imported.value);
    return imported === specifier.local.name ? imported : `${imported}:${specifier.local.name}`;
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
