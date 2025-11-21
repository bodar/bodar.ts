import {Promises, type RaceResult} from "./Promises.ts";
import {isPromiseLike} from "./IsAsyncIterable.ts";

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
    const iterators = iterables.map(it => it[Symbol.asyncIterator]());

    if (iterators.length === 0) {
        yield [];
        return;
    }

    const results = await Promise.all(iterators.map(i => i.next()));
    let complete = results.map(r => !!r.done)
    const currentValues = results.map(r => r.value);
    yield currentValues.slice();

    while (true) {
        const partial = await Promises.raceAll(iterators.map(i => i.next()));
        partial.forEach((r, i) => {
            if (!isPromiseLike(r)) {
                if (r.done) complete[i] = true;
                else currentValues[i] = r.value;
            }
        })
        if (complete.every(c => c)) break;
        else {
            if (noUpdate(partial)) continue;
            yield currentValues.slice();
        }
    }
}

function noUpdate(results: RaceResult<IteratorYieldResult<any> | IteratorReturnResult<any>>[]): boolean {
    return results.every((result) => isPromiseLike(result) || !!result.done);
}