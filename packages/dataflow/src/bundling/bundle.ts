/** @module
 *
 */

import {tmpdir} from "node:os";
import {join} from "node:path";
import {simpleHash} from "../simpleHash.ts";

/** Simple function to bundle the typescript file */
export async function bundleFile(path: string): Promise<string> {
    const result = await Bun.build({
        entrypoints: [path],
        minify: true,
    });
    let bundled: string | undefined;
    for (const output of result.outputs) {
        bundled = await output.text();
        break;
    }
    return bundled!;
}

export async function bundleText(source: string, extension: string, temp: string = tmpdir()): Promise<string> {
    const key = simpleHash(source);
    const path = join(temp, `${key}.${extension}`);
    try {
        await Bun.write(path, source);
        return await bundleFile(path);
    } finally {
        await Bun.file(path).delete();
    }
}