/** @module
 *
 */

import {join} from "node:path";
import {simpleHash} from "../simpleHash.ts";

/** Simple function to bundle the typescript file (`files` adds in-memory files, keyed by path) */
export async function bundleFile(path: string, minify: boolean, files?: Record<string, string>): Promise<string> {
    const result = await Bun.build({
        entrypoints: [path],
        minify,
        files,
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

/**
 * Bundles source code text in memory, as if it were a file in `dir` (default: the working directory):
 * its relative imports resolve beside it and its bare imports through that directory's node_modules
 */
export async function bundleText(source: string, extension: string, minify: boolean = true, dir: string = process.cwd()): Promise<string> {
    const path = join(dir, `${simpleHash(source)}.${extension}`);
    return bundleFile(path, minify, {[path]: source});
}

/** Transpile TypeScript to JavaScript without bundling (preserves imports) */
export async function transpileFile(path: string): Promise<string> {
    const source = await Bun.file(path).text();
    const transpiler = new Bun.Transpiler({ loader: "ts" });
    return transpiler.transformSync(source);
}