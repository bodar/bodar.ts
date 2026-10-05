import {afterAll, beforeAll, describe, expect, spyOn, test} from "bun:test";
import {join} from "path";
import {mkdtemp, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {bundleText} from "../../src/bundling/bundle.ts";
import {BunBundler} from "../../src/bundling/BunBundler.ts";

const block = `import {helper} from "./lib/helper.js";
import {shout} from "fake-pkg";
console.log(shout(helper()));`;

describe("bundling a block", () => {
    let app: string;

    beforeAll(async () => {
        // An app of its own: a relative module and an installed package, nothing from this repo
        app = await mkdtemp(join(tmpdir(), 'dataflow-app-'));
        await Bun.write(join(app, 'lib/helper.js'), 'export const helper = () => "helper-from-app";');
        await Bun.write(join(app, 'node_modules/fake-pkg/package.json'), JSON.stringify({name: 'fake-pkg', main: 'index.js'}));
        await Bun.write(join(app, 'node_modules/fake-pkg/index.js'), 'export const shout = s => s + "-shouted";');
    });

    afterAll(async () => {
        await rm(app, {recursive: true, force: true});
    });

    test("resolves relative and bare imports from the directory it is given", async () => {
        const bundled = await bundleText(block, 'js', false, app);
        expect(bundled.includes('helper-from-app')).toBe(true);
        expect(bundled.includes('-shouted')).toBe(true);
    });

    test("bundles in memory: writes no file anywhere", async () => {
        const write = spyOn(Bun, 'write');
        try {
            await bundleText(block, 'js', false, app);
            expect(write).not.toHaveBeenCalled();
        } finally {
            write.mockRestore();
        }
    });

    test("BunBundler bundles from the directory it is given", async () => {
        const bundled = await new BunBundler(false, app).transform(block);
        expect(bundled.includes('helper-from-app')).toBe(true);
    });
});
