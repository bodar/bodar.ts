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
    let bundled: string | undefined;
    for (const output of result.outputs) {
        bundled = await output.text();
        break;
    }
    return bundled!;
}

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