/** @module */
import type {Bundler} from "./Bundler.ts";
import {bundleText} from "./bundle.ts";

/** Bundles a page's blocks in memory; their imports resolve from `dir` (default: the working directory) */
export class BunBundler implements Bundler {
    constructor(private minify: boolean = true, private dir: string = process.cwd()) {
    }
    async transform(javascript: string): Promise<string> {
        return bundleText(javascript, 'js', this.minify, this.dir)
    }
}