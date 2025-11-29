#!/usr/bin/env ./bootstrap.sh
import {$, file, Glob, write} from "bun";
import {dirname, join} from "path";

process.env.FORCE_COLOR = "1";
process.env.CLAUDECODE = "1";

export async function version() {
    const branch = process.env.GITHUB_REF_NAME || (await $`git rev-parse --abbrev-ref HEAD`.quiet()).text().trim();
    const buildNumber = process.env.GITHUB_RUN_NUMBER || new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
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
    await $`bun install --ignore-scripts`.quiet();
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

export async function demo() {
    await $`bun run --watch packages/dataflow/server.ts`;
}

export async function build() {
    await clean();
    await generateExports();
    await check();
    await test();
}

export async function generateExports(packageGlob: string = "packages/*/package.json") {
    for await (const f of new Glob(packageGlob).scan(".")) {
        const packageJsonFile = file(f!);
        const packageJson = await packageJsonFile.json();
        const parent = dirname(f!);
        const srcDir = join(parent, 'src');

        const exports: Record<string, string> = {};
        for await (const ts of new Glob("./**/*.ts").scan(srcDir)) {
            const content = await file(join(srcDir, ts)).text();
            if(content.includes('@module')) exports[ts] = ts.replace('./', './src/');
        }
        packageJson.exports = Object.fromEntries(Object.entries(exports).sort((a, b) => a[0].localeCompare(b[0])));
        packageJson.files = [
            "src",
            "README.md",
            "package.json"
        ]
        await write(packageJsonFile, JSON.stringify(packageJson, null, 2));
        console.log(`Updated exports and files for ${packageJson.name} (${Object.keys(exports).length} files)`);
    }
}

export async function generateDocs() {
    await $`bun run packages/dataflow/docs.ts`;
}

export async function generateJsr() {
    const v = await version();

    for await (const f of new Glob("packages/*/package.json").scan(".")) {
        const packageJsonFile = file(f);
        const packageJson = await packageJsonFile.json();
        const parent = dirname(f!);
        const jsrFile = file(join(parent, 'jsr.json'));

        if (packageJson.dependencies) {
            for (const [depName, depVersion] of Object.entries(packageJson.dependencies)) {
                if (typeof depVersion === 'string' && depVersion.startsWith('workspace:')) {
                    packageJson.dependencies[depName] = v;
                }
            }
            await write(packageJsonFile, JSON.stringify(packageJson, null, 2));
        }

        const jsrConfig: any = {
            name: packageJson.name,
            version: v,
            exports: packageJson.exports,
            license: 'Apache-2.0'
        };

        if (packageJson.files) {
            jsrConfig.publish = {
                include: packageJson.files
            };
        }

        await write(jsrFile, JSON.stringify(jsrConfig, null, 2));
    }
}

export async function publish() {
    await generateJsr();
    try {
        if (process.env.JSR_TOKEN) {
            await $`bunx jsr publish --allow-dirty --verbose --token ${process.env.JSR_TOKEN}`;
        } else {
            await $`bunx jsr publish --allow-dirty --verbose`;
        }
    } finally {
        await $`git checkout packages/*/package.json`;
        await $`rm -rf **/jsr.json`;
    }
}

export async function ci() {
    await build();
    await generateDocs();
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
