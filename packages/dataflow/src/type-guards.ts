export function isAsyncIterable(instance: any): instance is AsyncIterable<any> {
    return typeof instance == 'object' && typeof instance[Symbol.asyncIterator] === 'function';
}

export function isIterator(instance: any): instance is (Iterator<any> | AsyncIterator<any>) {
    return typeof instance === 'object' && typeof instance.next === 'function' && (instance.next.length === 0 || instance.next.length === 1)
}

export function isPromiseLike(instance: any): instance is PromiseLike<any> {
    return typeof instance == 'object' && typeof instance.then === 'function';
}

const GeneratorFunction = (function* () {
}).constructor;

export function isGeneratorFunction(instance: any): instance is GeneratorFunction {
    return typeof instance == 'function' && instance instanceof GeneratorFunction;
}

const AsyncGeneratorFunction = (async function* () {
}).constructor;

export function isAsyncGeneratorFunction(instance: any): instance is AsyncGeneratorFunction {
    return typeof instance == 'function' && instance instanceof AsyncGeneratorFunction;
}