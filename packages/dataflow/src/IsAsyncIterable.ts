export function isAsyncIterable(instance: any): instance is AsyncIterable<any> {
    return typeof instance == 'object' && typeof instance[Symbol.asyncIterator] === 'function';
}

export function isAsyncIterator(instance: any): instance is AsyncIterator<any> {
    return typeof instance === 'object' && typeof instance.next === 'function' && (instance.next.length === 0 || instance.next.length === 1)
}