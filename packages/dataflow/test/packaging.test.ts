import {describe, expect, test} from "bun:test";
import {Glob} from "bun";
import {join} from "path";

const root = join(import.meta.dir, '..');
const pkg = await Bun.file(join(root, 'package.json')).json();

/** Bare package names a source file imports (statically or dynamically) */
function imported(source: string): string[] {
    const specifiers = [...source.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)["']([^"'.\/][^"']*)["']/g)].map(m => m[1]);
    return specifiers.map(s => s.startsWith('@') ? s.split('/').slice(0, 2).join('/') : s.split('/')[0]);
}

describe("published package", () => {
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
