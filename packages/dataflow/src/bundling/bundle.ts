/** @module
 *
 */

import {join} from "node:path";
import {simpleHash} from "../simpleHash.ts";

/** Simple function to bundle the typescript file */
export async function bundleFile(path: string, minify: boolean): Promise<string> {
    const result = await Bun.build({
        entrypoints: [path],
        minify,
    });
    if (!result.success) {
        console.error('Build failed for:', path);
        for (const log of result.logs) {
            console.error(log);
        }
        throw new Error(`Build failed: ${result.logs.map(l => l.message).join(', ')}`);
    }
    let bundled: string | undefined;
    for (const output of result.outputs) {
        bundled = await output.text();
        break;
    }
    return bundled!;
}

/** Bundles source code text by writing to temp file and bundling */
export async function bundleText(source: string, extension: string, minify: boolean = true, temp: string = import.meta.dir): Promise<string> {
    const key = simpleHash(source);
    const path = join(temp, `${key}.${extension}`);
    try {
        await Bun.write(path, source);
        return await bundleFile(path, minify);
    } finally {
        await Bun.file(path).delete();
    }
}

/** Transpile TypeScript to JavaScript without bundling (preserves imports) */
export async function transpileFile(path: string): Promise<string> {
    const source = await Bun.file(path).text();
    const transpiler = new Bun.Transpiler({ loader: "ts" });
    return transpiler.transformSync(source);
}