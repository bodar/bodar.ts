/**
 * A predicate is a function that returns true or false for a given value.
 */
export interface Predicate<A> {
    /**
     * Returns true if the predicate holds for the given value, false otherwise
     */
    (a: A) : boolean

    /**
     * Returns a string representation of the predicate
     */
    toString(): string;
}