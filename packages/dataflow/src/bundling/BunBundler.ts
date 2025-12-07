import type {Bundler} from "./Bundler.ts";
import {bundleText} from "./bundle.ts";

export class BunBundler implements Bundler {
    async transform(javascript: string): Promise<string> {
        return bundleText(javascript, 'js', import.meta.dir)
    }
}