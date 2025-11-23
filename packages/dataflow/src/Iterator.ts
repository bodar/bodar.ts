/** @module
 * iterator function
 * */

/** Converts a callback into an AsyncIterator */
export async function* iterator<T>(init: (notify: (e: T) => any) => any, value?: T): AsyncIterator<T> {
    let {promise, resolve} = Promise.withResolvers<T>();
    // Must close over the resolve variable to see it change
    init((v => resolve(value = v)))

    if(value !== undefined) yield value;

    while (true) {
        await promise;
        // Must create new promise before yielding otherwise we miss any synchronous notifications
        ({promise, resolve} = Promise.withResolvers<T>());
        yield value!;
    }
}