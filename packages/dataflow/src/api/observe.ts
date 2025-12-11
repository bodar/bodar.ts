/** @module
 * iterator function
 * */

/** Converts a callback into an AsyncIterator that never finishes */
export async function* observe<T>(init: (notify: (e: T) => any) => any, value?: T): AsyncIterator<T> {
    let {promise, resolve} = Promise.withResolvers<T>();
    // Must close over the resolve variable to see it change
    const maybeDispose = init((v => resolve(value = v)));

    try {
        if (value !== undefined) yield value;

        while (true) {
            await promise;
            // Must create new promise before yielding otherwise we miss any synchronous notifications
            ({promise, resolve} = Promise.withResolvers<T>());
            yield value!;
        }
    } finally {
        if (typeof maybeDispose === 'function' && maybeDispose.length === 0) maybeDispose();
    }
}