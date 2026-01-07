/** @module
 * iterator function
 * */

/** Converts a callback into an AsyncIterator that terminates on undefined */
export function observe<T>(init: (notify: (t: T | undefined) => any) => any, value?: T, terminate: (t: T | undefined) => boolean = t => t === undefined): AsyncGenerator<T> {
    let signal = Promise.withResolvers<T>()

    async function* generator(): AsyncGenerator<T> {
        // Must close over the signal variable to see it change
        const dispose = init((v => signal.resolve(value = v)));

        try {
            if (value !== undefined) yield value;

            while (true) {
                await signal.promise;
                // Must create new promise before yielding otherwise we miss any synchronous notifications
                signal = Promise.withResolvers<T>();
                if (terminate(value)) break;
                yield value!;
            }
        } finally {
            if (typeof dispose === 'function' && dispose.length === 0) await dispose();
        }
    }

    // Make generator interruptible even when awaiting
    const instance = generator();
    const originalReturn = instance.return;
    Reflect.set(instance, 'return', function (returnValue?: any): Promise<IteratorResult<T>> {
        terminate = () => true;
        signal.resolve?.(undefined);
        return originalReturn.call(instance, returnValue);
    });

    return instance;
}