import {AsyncIteratorRacer, interruptible} from "./AsyncIteratorRacer.ts";
import {empty, lagging, merge, type Stamped} from "./Stamp.ts";

/**
 * Combines multiple async iterables into a single async iterable that emits
 * an array of the latest values whenever any source emits.
 */
export async function* combineLatest(iterables: AsyncIterable<any>[]): AsyncIterableIterator<any[]> {
    let iterators: [number, AsyncIterator<any>][] = iterables.map(((it, index) => ([index, it[Symbol.asyncIterator]()])));

    await using racer = new AsyncIteratorRacer<number, any>(iterators);

    const results = await Promise.all(iterators.map(([, iterator]) => iterator.next()));
    const values = results.map(r => r.value);
    yield values.slice();

    for await (const resolved of racer) {
        for (const [index, result] of resolved) {
            if (!result.done) values[index] = result.value;
        }
        if (resolved.values().some(result => !result.done)) yield values.slice();
    }
}

/**
 * Like combineLatest, but only emits combinations whose stamps are consistent:
 * no input is behind another on an upstream node they share (diamond shaped graphs).
 * While inconsistent it only pulls the inputs that are behind, so the ones ahead wait.
 */
export function combineStamped(iterables: AsyncIterable<Stamped<any>>[]): AsyncIterableIterator<Stamped<any[]>> {
    const racer = new AsyncIteratorRacer<number, Stamped<any>>(iterables.map((it, index) => [index, it[Symbol.asyncIterator]()]));
    return interruptible(stamped(iterables.map((_, index) => index), racer), racer);
}

async function* stamped(indexes: number[], race: AsyncIteratorRacer<number, Stamped<any>>): AsyncGenerator<Stamped<any[]>> {
    await using racer = race;
    const latest: (Stamped<any> | undefined)[] = indexes.map(() => undefined);
    let changed = true;

    while (true) {
        // An input that finished without a value counts as undefined, like combineLatest
        indexes.forEach(index => {
            if (!latest[index] && !racer.has(index)) latest[index] = {value: undefined, stamp: empty};
        });
        const missing = indexes.filter(index => !latest[index]);
        // A finished input can never catch up, so it is never waited for
        const behind = Array.from(lagging(latest.map((s, index) => racer.has(index) ? s?.stamp : undefined)));

        if (changed && missing.length === 0 && behind.length === 0) {
            yield {value: latest.map(s => s!.value), stamp: merge(latest.map(s => s!.stamp))};
            changed = false;
        }
        if (!racer.continue) return;

        const resolved = await racer.race(missing.length > 0 ? missing : behind.length > 0 ? behind : indexes);
        for (const [index, result] of resolved) {
            latest[index] = result.value;
            changed = true;
        }
    }
}
