/**
 * A function that takes an A and returns a B
 */
export interface Mapper<A, B> {
    /**
     * Applies the function to the given value
     */
    (a: A): B;

    /**
     * Returns a string representation of the mapper
     */
    toString(): string;
}