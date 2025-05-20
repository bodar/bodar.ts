export type Overwrite<T, U> = Omit<T, keyof U> & U;
export type Chain<T extends any[]> = T extends [infer First, ...infer Rest]
    ? Overwrite<Chain<Rest>, First>
    : {};

export function chain<T extends object[]>(...objects: T): Chain<T> {
    return new Proxy({}, {
        get(_target, prop, _receiver) {
            for (const obj of objects) {
                try {
                    const result = Reflect.get(obj, prop, obj);
                    if (prop in obj || typeof result !== 'undefined') return result;
                } catch (_e) {
                }
            }
        }
    }) as Chain<T>
}