#!/usr/bin/env ./bootstrap.sh
import { $, file, Glob, write } from "bun";
import { dirname, join } from "path";

process.env.FORCE_COLOR = "1";

export async function version() {
    const branch = process.env.CIRCLE_BRANCH || (await $`git rev-parse --abbrev-ref HEAD`.quiet()).text().trim();
    const buildNumber = process.env.CIRCLE_BUILD_NUM || new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
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
    await check();
    await test();
}

async function toPromiseArray<T>(iterable: AsyncIterable<T>): Promise<T[]> {
    const result: T[] = [];
    for await (const value of iterable) result.push(value);
    return result;
}

export async function publish() {
    const v = await version();

    for await (const f of new Glob("packages/**/src/package.json").scan(".")) {
        const packageJson = await file(f).json();
        const parent = dirname(f!);
        const jsrFile = file(join(parent, 'jsr.json'));
        const typescript = await toPromiseArray<string>(new Glob("./**/types.ts").scan(parent));
        if (typescript.length > 0) await write(jsrFile, JSON.stringify({
            name: packageJson.name,
            version: v,
            exports: typescript.reduce((a: any, ts: string) => {
                a[ts.replace(/\.ts$/, '')] = ts;
                return a;
            }, {}),
            license: 'Apache-2.0'
        }, null, 2));
    }

    await $`bunx jsr publish --allow-dirty --token ${process.env.JSR_TOKEN}`;
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
