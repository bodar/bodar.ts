import {file, Glob, write} from "bun";
import {join} from "path";
import {HTMLTransformer} from "./src/html/HTMLTransformer.ts";
import {BunBundler} from "./src/bundling/BunBundler.ts";
import {transpileFile} from "./src/bundling/bundle.ts";

const ROOT = import.meta.dir;
const docsDir = join(ROOT, "docs");
const outDir = join(ROOT, "out");

for await (const path of new Glob("**/*").scan({cwd: docsDir, onlyFiles: true})) {
    const src = file(join(docsDir, path));
    if (path.endsWith(".html")) {
        const transformer = new HTMLTransformer({rewriter: new HTMLRewriter(), bundler: new BunBundler()});
        const output = transformer.transform(await src.text());
        await write(join(outDir, path), output);
        console.log(`Generated ${path}`);
    } else {
        await write(join(outDir, path), src);
        console.log(`Copied ${path}`);
    }
}

await Bun.build({
    entrypoints: [join(ROOT, 'src/runtime.ts')],
    minify: true,
    sourcemap: true,
    outdir: outDir
});
console.log(`Bundled runtime.js`);

// Transpile vgplot extensions (not bundled - expects @uwdata/vgplot as peer dependency)
const reconnectingSocket = await transpileFile(join(ROOT, 'src/vgplot/reconnecting-socket.ts'));
await write(join(outDir, 'vgplot', 'reconnecting-socket.js'), reconnectingSocket);
console.log(`Transpiled vgplot/reconnecting-socket.js`);
