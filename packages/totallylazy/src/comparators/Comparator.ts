/** @module Core comparator type */
/**
 * A function that compares two values and returns a number indicating their relative order.
 * Returns negative if a < b, 0 if a == b, positive if a > b.
 */
export interface Comparator<A> {
    (a: A, b: A): number

    /**
     * Returns a string representation of the comparator
     */
    toString(): string;
}