/** @module String conversion utility */
/** Converts a value to its string representation, handling special cases like undefined and null */
export function toString(value: unknown): string {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (Object.hasOwn(value, 'toString')) return value.toString();
    if (typeof value === 'function') return value.toString();
    return JSON.stringify(value)
}