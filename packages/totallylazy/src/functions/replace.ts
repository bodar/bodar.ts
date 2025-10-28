/** @module Object property replacement utility */
/** Replaces a property value in an object by redefining it with Object.defineProperty */
export function replace<T extends object, K extends keyof T>(object: T, key: K, value: T[K]): T {
    return Object.defineProperty(object, key, {value});
}