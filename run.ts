#!/usr/bin/env ./commands.sh
import { $ } from "bun";

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

export async function ci() {
  await clean();
  await check();
  await version();
  await build();
}

const command = process.argv[2] || 'build';
const args = process.argv.slice(3);

try {
  await eval(command)(...args);
} catch (e) {
  console.error('Command failed:', command, ...args);
  process.exit(1);
}
