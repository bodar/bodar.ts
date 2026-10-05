import {describe, expect, test} from "bun:test";
import {join} from "path";
import {mkdtemp, rm} from "node:fs/promises";
import {tmpdir} from "node:os";

const src = join(import.meta.dir, '..', 'src');
const tsgo = join(import.meta.dir, '..', '..', '..', 'node_modules', '.bin', 'tsgo');

describe("published package", () => {
    test("the compiled module imports no .d.ts at runtime", async () => {
        const js = new Bun.Transpiler({loader: 'ts'}).transformSync(await Bun.file(join(src, 'JSX2DOM.ts')).text());
        expect(js.includes('.d.ts')).toBe(false);
    });

    test("a consumer sees the JSX namespace from the emitted declarations alone", async () => {
        const dir = await mkdtemp(join(tmpdir(), 'jsx2dom-'));
        try {
            const options = ['--ignoreConfig', '--target', 'ESNext', '--module', 'ESNext', '--moduleResolution', 'bundler', '--lib', 'ESNext,DOM',
                '--allowImportingTsExtensions', '--rewriteRelativeImportExtensions', '--skipLibCheck', '--strict'];
            // Like JSR's _dist: declarations only, from the exported entry points
            const emit = Bun.spawnSync([tsgo, ...options, '--declaration', '--emitDeclarationOnly', '--outDir', join(dir, 'dist'),
                join(src, 'JSX2DOM.ts'), join(src, 'PositionalJSX.ts')]);
            expect(emit.stdout.toString() + emit.stderr.toString()).toBe('');
            await Bun.write(join(dir, 'consumer.tsx'), `import {JSX2DOM} from "./dist/JSX2DOM.js";
const jsx = new JSX2DOM(globalThis as any);
const element: JSX.Element = <div class="x"/>;
export {jsx, element};
`);
            const check = Bun.spawnSync([tsgo, ...options.filter(o => o !== '--rewriteRelativeImportExtensions'), '--noEmit',
                '--jsx', 'react', '--jsxFactory', 'jsx.createElement', '--jsxFragmentFactory', 'null', join(dir, 'consumer.tsx')]);
            expect(check.stdout.toString() + check.stderr.toString()).toBe('');
        } finally {
            await rm(dir, {recursive: true, force: true});
        }
    }, 30_000);
});
