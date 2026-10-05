import {describe, expect, test} from "bun:test";
import {Glob} from "bun";
import {join} from "path";

const root = join(import.meta.dir, '..');
const pkg = await Bun.file(join(root, 'package.json')).json();

const transpiler = new Bun.Transpiler({loader: 'ts'});

/** Bare package names a source file really imports (statically or dynamically, not in strings) */
function imported(source: string): string[] {
    return transpiler.scanImports(source).map(i => i.path).filter(path => !path.startsWith('.'))
        .map(path => path.startsWith('@') ? path.split('/').slice(0, 2).join('/') : path.split('/')[0]);
}

describe("published package", () => {
    test("src only imports its declared dependencies (others resolve only inside the workspace)", async () => {
        const declared = new Set(Object.keys(pkg.dependencies ?? {}));
        const undeclared: string[] = [];
        for await (const path of new Glob('src/**/*.ts').scan(root)) {
            for (const name of imported(await Bun.file(join(root, path)).text())) {
                if (!declared.has(name) && !name.startsWith('node:') && name !== 'bun') undeclared.push(`${path}: ${name}`);
            }
        }
        expect(undeclared).toEqual([]);
    });

    test("src never imports a devDependency (it would become a dependency on JSR)", async () => {
        const dev = new Set(Object.keys(pkg.devDependencies ?? {}));
        const offenders: string[] = [];
        for await (const path of new Glob('src/**/*.ts').scan(root)) {
            for (const name of imported(await Bun.file(join(root, path)).text())) {
                if (dev.has(name)) offenders.push(`${path}: ${name}`);
            }
        }
        expect(offenders).toEqual([]);
    });
});
