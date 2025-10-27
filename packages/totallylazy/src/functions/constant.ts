/**
 * A function that always returns the same constant value, regardless of input
 */
export interface Constant<T> {
    (..._ignored: any[]): T;

    value: T;
}

/**
 * Creates a function that always returns the same constant value
 *
 * @example
 * ```ts
 * const getAnswer = constant(42);
 * getAnswer(); // 42
 * getAnswer(1, 2, 3); // 42
 * ```
 */
export function constant<T>(value: T): Constant<T> {
    return Object.assign(function constant(..._ignored: any[]) {
        return value;
    }, {
        value,
        toString: () => `constant(${value})`
    });
}

/**
 * Checks if the given value is a Constant function
 */
export function isConstant<T = any>(value: any): value is Constant<T> {
    return typeof value === 'function' && value.name === 'constant' && Object.hasOwn(value, 'value');
}

/**
 * A constant function that always returns true
 */
export const alwaysTrue: Constant<true> = constant(true);

/**
 * A constant function that always returns false
 */
export const alwaysFalse: Constant<false> = constant(false);
