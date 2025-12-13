/** @module
 * iterator function
 * */

/** Converts a callback into an AsyncIterator that terminates on undefined */
export async function* observe<T>(init: (notify: (t: T | undefined) => any) => any, value?: T, terminate: (t: T | undefined) => boolean = t => t === undefined): AsyncGenerator<T> {
    let {promise, resolve} = Promise.withResolvers<T>();
    // Must close over the resolve variable to see it change
    const dispose = init((v => resolve(value = v)));

    try {
        if (value !== undefined) yield value;

        while (true) {
            await promise;
            // Must create new promise before yielding otherwise we miss any synchronous notifications
            ({promise, resolve} = Promise.withResolvers<T>());
            if (terminate(value)) break;
            yield value!;
        }
    } finally {
        if (typeof dispose === 'function' && dispose.length === 0) dispose();
    }
}