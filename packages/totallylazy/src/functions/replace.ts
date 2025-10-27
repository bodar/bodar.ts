/**
 * Replaces a property value in an object by redefining it with Object.defineProperty
 *
 * @example
 * ```ts
 * const obj = { x: 1, y: 2 };
 * replace(obj, 'x', 10);
 * obj.x; // 10
 * ```
 */
export function replace<T extends object, K extends keyof T>(object: T, key: K, value: T[K]): T {
    return Object.defineProperty(object, key, {value});
}