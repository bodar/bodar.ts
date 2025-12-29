import {AsyncIteratorRacer} from "./AsyncIteratorRacer.ts";

/**
 * Combines multiple async iterables into a single async iterable that emits
 * an array of the latest values whenever any source emits.
 */
export async function* combineLatest(iterables: AsyncIterable<any>[]): AsyncIterableIterator<any[]> {
    let iterators: [number, AsyncIterator<any>][] = iterables.map(((it, index) => ([index, it[Symbol.asyncIterator]()])));

    await using racer = new AsyncIteratorRacer<number, any>(iterators);

    const results = await Promise.all(iterators.map(([, iterator]) => iterator.next()));
    const currentValues = results.map(r => r.value);
    yield currentValues.slice();
    results.length = 0;

    while (racer.continue) {
        const resolved = await racer.race();
        for (const [index, result] of resolved) {
            if (!result.done) currentValues[index] = result.value;
        }
        if (resolved.values().some(result => !result.done)) yield currentValues.slice();
    }
}
