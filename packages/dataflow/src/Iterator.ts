export enum IteratorStrategy {
    earliest,
    latest
}

export async function* iterator<T>(init: (notify: (e: T) => any) => any, latest: T, strategy: IteratorStrategy): AsyncIterator<T> {
    let {promise, resolve} = Promise.withResolvers<T>();
    // Must close over the resolve variable to see it change
    init((v => resolve(latest = v)))

    yield latest;

    while (true) {
        const earliest = await promise;
        // Must create new promise before yielding otherwise we miss any synchronous notifications
        ({promise, resolve} = Promise.withResolvers<T>());
        yield strategy === IteratorStrategy.latest ? latest! : earliest;
    }
}