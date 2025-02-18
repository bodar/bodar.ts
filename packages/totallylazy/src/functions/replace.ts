export function replace<T extends object, K extends keyof T>(object: T, key: K, value: T[K]): T {
    return Object.defineProperty(object, key, {value});
}