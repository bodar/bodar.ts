/**
 * Combines multiple async iterables into a single async iterable that emits
 * an array of the latest values whenever any source emits.
 *
 * Semantics (following RxJS combineLatest):
 * 1. Waits for all sources to emit at least once before emitting
 * 2. After initial emission, emits whenever ANY source emits
 * 3. When a source completes, continues using its last value
 * 4. Completes when ALL sources complete
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
export async function* combineLatest<T extends any[]>(
    iterables: { [K in keyof T]: AsyncIterable<T[K]> }
): AsyncIterableIterator<T> {
    const iterators = (iterables as AsyncIterable<any>[]).map(it => it[Symbol.asyncIterator]());

    // Wait for all iterators to emit at least once
    let results = await Promise.all(iterators.map(i => i.next()));
    let currentValues = results.map(r => r.value) as T;
    yield [...currentValues] as T;

    // Create ONE pending promise per active iterator
    const pending = new Map<number, Promise<{ index: number, result: IteratorResult<any> }>>();

    for (let i = 0; i < iterators.length; i++) {
        if (!results[i].done) {
            pending.set(i, iterators[i].next().then(result => ({ index: i, result })));
        }
    }

    while (pending.size > 0) {
        // Race current pending promises
        const { index, result } = await Promise.race(pending.values());

        // Remove this promise from pending
        pending.delete(index);

        // Update state
        results[index] = result;

        if (!result.done) {
            currentValues[index] = result.value;

            // Create NEW promise for this iterator
            pending.set(index, iterators[index].next().then(r => ({ index, result: r })));

            yield [...currentValues] as T;
        }
    }
}
