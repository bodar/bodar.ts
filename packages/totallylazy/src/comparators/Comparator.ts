export interface Comparator<A> {
    (a: A, b: A): number

    /**
     * Returns a string representation of the predicate
     */
    toString(): string;
}