#!/usr/bin/env ./bootstrap.sh
import { $, file, Glob, write } from "bun";
import { dirname, join } from "path";

process.env.FORCE_COLOR = "1";

export async function version() {
    const branch = process.env.CIRCLE_BRANCH || process.env.GITHUB_REF_NAME || (await $`git rev-parse --abbrev-ref HEAD`.quiet()).text().trim();
    const buildNumber = process.env.CIRCLE_BUILD_NUM || process.env.GITHUB_RUN_NUMBER || new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
    const revisions = (await $`git rev-list --count ${branch}`.quiet()).text().trim();
    const version = `0.${revisions}.${buildNumber}`;

    console.log(`version: ${version}`);
    return version;
}

export async function tag() {
    const ver = await version();
    await $`git config --global user.name "Server"`.quiet();
    await $`git config --global user.email "server@bodar.com"`.quiet();
    await $`git tag -a ${ver} -m "Release ${ver}"`.quiet();
    await $`git push origin ${ver}`.quiet();
}

export async function clean() {
    await $`rm -rf artifacts`;
    await $`bun install`.quiet();
}

export async function check() {
    await $`bun run --bun tsc --noEmit`;
}

export async function test(...args: string[]) {
    await $`bun test ${args}`;
}

export async function coverage() {
    await test('--coverage');
}

export async function dev() {
    await test('--watch');
}

export async function build() {
    await clean();
    await regenerateExports();
    await check();
    await test();
}

async function toPromiseArray<T>(iterable: AsyncIterable<T>): Promise<T[]> {
    const result: T[] = [];
    for await (const value of iterable) result.push(value);
    return result;
}

export async function regenerateExports(packageGlob: string = "packages/*/package.json") {
    for await (const f of new Glob(packageGlob).scan(".")) {
        const packageJsonFile = file(f!);
        const packageJson = await packageJsonFile.json();
        const parent = dirname(f!);
        const srcDir = join(parent, 'src');

        const typescript = await toPromiseArray<string>(
            new Glob("./**/*.ts").scan(srcDir)
        );

        if (typescript.length > 0) {
            const exports = typescript
                .filter(ts => !ts.includes('.test.ts'))
                .reduce((a: any, ts: string) => {
                    const key = ts.replace('./', './');  // Keep .ts in key
                    const value = ts.replace('./', './src/');  // ./file.ts -> ./src/file.ts
                    a[key] = value;
                    return a;
                }, {});

            packageJson.exports = exports;
            await write(packageJsonFile, JSON.stringify(packageJson, null, 2));
            console.log(`Updated exports for ${packageJson.name} (${Object.keys(exports).length} files)`);
        }
    }
}

export async function generateJsrJson() {
    const v = await version();

    // Publish yadic and totallylazy packages (lazyrecords pending totallylazy publication)
    for await (const f of new Glob("packages/{yadic,totallylazy}/package.json").scan(".")) {
        const packageJson = await file(f).json();
        const parent = dirname(f!);
        const jsrFile = file(join(parent, 'jsr.json'));

        const jsrConfig: any = {
            name: packageJson.name,
            version: v,
            exports: packageJson.exports,  // Use exports directly from package.json
            license: 'Apache-2.0'
        };

        // Convert files from package.json to publish.include for JSR
        if (packageJson.files) {
            jsrConfig.publish = {
                include: packageJson.files
            };
        }

        await write(jsrFile, JSON.stringify(jsrConfig, null, 2));
    }
}

export async function publish() {
    await generateJsrJson();
    if (process.env.JSR_TOKEN) {
        await $`bunx jsr publish --allow-dirty --verbose --token ${process.env.JSR_TOKEN}`;
    } else {
        await $`bunx jsr publish --allow-dirty --verbose`;
    }
    await $`rm -rf **/jsr.json`;
}

export async function ci() {
    await build();
    await publish();
}

const command = process.argv[2] || 'build';
const args = process.argv.slice(3);

try {
    await eval(command)(...args);
} catch (e: any) {
    if (e instanceof ReferenceError) {
        const { exitCode } = await $`${command} ${args}`.nothrow();
        process.exit(exitCode);
    } else {
        console.error('Command failed:', command, ...args, e.message);
        process.exit(1);
    }
}
