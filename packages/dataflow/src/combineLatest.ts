/**
 * Combines multiple async iterables into a single async iterable that emits
 * an array of the latest values whenever any source emits.
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
    results.length = 0;

    const pending = new Map<number, Promise<any>>();
    const resolved = new Map<number, IteratorResult<any>>();
    let {promise: signal, resolve: signalResolve} = Promise.withResolvers<void>();

    while (true) {
        for (const {iterator, index} of iterators) {
            if (!pending.has(index)) {
                pending.set(index, iterator.next().then(result => {
                    pending.delete(index);
                    resolved.set(index, result);
                    signalResolve();
                }));
            }
        }

        await Promise.all([signal, Promise.resolve()]); // Let other microtasks complete for batching
        // This must be done before yielding otherwise we can miss a sync update
        ({promise: signal, resolve: signalResolve} = Promise.withResolvers<void>());

        for (const [index, result] of resolved.entries()) {
            if (result.done) {
                complete[index] = true;
            } else {
                currentValues[index] = result.value;
            }
        }
        const hadUpdates = resolved.values().some(result => !result.done);
        resolved.clear();

        iterators = iterators.filter(({index}) => !complete[index]);
        if (complete.every(c => c)) break;
        if (hadUpdates) yield currentValues.slice();
    }
}
