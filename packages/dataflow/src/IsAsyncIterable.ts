export function isAsyncIterable(instance: any): instance is AsyncIterableIterator<any> {
    return typeof instance == 'object' && Symbol.asyncIterator in instance;
}