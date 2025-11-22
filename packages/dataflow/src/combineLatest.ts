import {raceAll} from "./Promise.ts";

/**
 * Combines multiple async iterables into a single async iterable that emits
 * an array of the latest values whenever any source emits.
 *
 * Semantics (following RxJS combineLatest):
 * 1. Waits for all sources to emit at least once before emitting
 * 2. After initial emission, emits whenever ANY source emits
 * 3. When a source completes, continues using its last value
 * 4. Completes when ALL sources complete
 * 5. Batches synchronous updates to prevent glitches (transient inconsistent states)
 *
 * @param iterables Array of async iterables to combine
 * @yields Array of latest values from each source
 *
 * @example
 * ```ts
 * async function* numbers() { yield 1; yield 2; }
 * async function* letters() { yield 'a'; yield 'b'; }
 *
 * for await (const [num, letter] of combineLatest([numbers(), letters()])) {
 *   console.log(num, letter); // [1, 'a'], [2, 'a'], [2, 'b']
 * }
 * ```
 */
export async function* combineLatest(
    iterables: AsyncIterable<any>[]
): AsyncIterableIterator<any[]> {
    let iterators = iterables.map(((it, index) => ({iterator: it[Symbol.asyncIterator](), index})));

    if (iterators.length === 0) {
        yield [];
        return;
    }

    const results = await Promise.all(iterators.map(({iterator}) => iterator.next()));
    const complete = results.map(r => !!r.done)
    const currentValues = results.map(r => r.value);
    yield currentValues.slice();

    const pending = new Map<number, Promise<any>>();
    while (true) {
        const promises = iterators.map(({iterator, index}) => {
            if (pending.has(index)) return pending.get(index)!;
            const promise = iterator.next().then(result => ({result, index}));
            pending.set(index, promise);
            return promise;
        });
        const updates = await raceAll(promises);
        updates.forEach(({result, index}) => {
            pending.delete(index);
            if (result.done) {
                complete[index] = true;
            } else currentValues[index] = result.value;
        })
        iterators = iterators.filter(({index}) => !complete[index]);
        if (complete.every(c => c)) break;
        else {
            if (noUpdate(updates)) continue;
            yield currentValues.slice();
        }
    }
}

function noUpdate(results: { result: IteratorResult<any>, index: number }[]): boolean {
    return results.every((({result}) => !!result.done));
}