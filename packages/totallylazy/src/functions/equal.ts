/**
 * Performs deep equality comparison of two values. Supports primitives, objects, arrays, Maps, Sets, Dates, RegExp, and functions.
 * Uses same-value-zero equality (NaN === NaN, +0 === -0).
 *
 * @example
 * ```ts
 * equal(1, 1); // true
 * equal({a: 1}, {a: 1}); // true
 * equal([1, 2], [1, 2]); // true
 * equal(new Set([1]), new Set([1])); // true
 * equal(NaN, NaN); // true
 * ```
 */
export function equal(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (typeof a !== typeof b) return false;

    if (typeof a == 'number' && typeof b == 'number') return a !== a && b !== b;

    if (typeof a == 'object' && typeof b == 'object') {
        if (a.constructor !== b.constructor) return false;

        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length != b.length) return false;
            for (let i = 0; i < a.length; i++) {
                if (!equal(a[i], b[i])) return false;
            }
            return true;
        }

        if ((a instanceof Map) && (b instanceof Map)) {
            if (a.size !== b.size) return false;
            for (const [key, value] of a.entries()) {
                if (!b.has(key)) return false;
                if (!equal(value, b.get(key))) return false;
            }
            return true;
        }

        if ((a instanceof Set) && (b instanceof Set)) {
            if (a.size !== b.size) return false;
            return equal(Array.from(a), Array.from(b));
        }

        // Both of these seem questionable (taken from fast-deep-equal)
        if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
        if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();

        return equal(Object.entries(a), Object.entries(b));
    }

    if (typeof a == 'function' && typeof b == 'function') {
        if (a.length != b.length) return false;
        if (a.name != b.name) return false;
        return a.toString() === b.toString();
    }

    return false;
}