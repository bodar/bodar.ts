/** @module */
import type {Bundler} from "./Bundler.ts";
import {bundleText} from "./bundle.ts";

export class BunBundler implements Bundler {
    constructor(private minify: boolean = true) {
    }
    async transform(javascript: string): Promise<string> {
        return bundleText(javascript, 'js', this.minify)
    }
}