/** @module Core predicate type and utilities */
/** A predicate is a function that returns true or false for a given value. */
export interface Predicate<A> {
    (a: A) : boolean

    toString(): string;
}