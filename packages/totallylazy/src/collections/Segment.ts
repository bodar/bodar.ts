/**
 * @module
 *
 * Immutable linked-list-style segments with head/tail access for efficient lazy iteration.
 */

import {NoSuchElement} from "../errors/NoSuchElement.ts";

/**
 * Immutable linked-list-style segment providing head/tail access for efficient lazy iteration
 */
export interface Segment<T> extends Iterable<T> {
    /** True if the segment contains no elements */
    empty: boolean;

    /** The first element of the segment */
    head: T;

    /** The remaining segment after the first element */
    tail: Segment<T>;

    /** Converts the segment to its string representation */
    toString(): string;

    /** Converts the segment to an array-like structure */
    toArray(): ArrayLike<T>;
}

/** Represents an empty segment with no elements */
export class EmptySegment implements Segment<any> {
    empty = true;

    get head(): never {
        throw new NoSuchElement();
    }

    get tail(): Segment<never> {
        throw new NoSuchElement();
    }

    * [Symbol.iterator](): Iterator<any> {
    }

    toString(): string {
        return toString(this);
    }

    toArray(): ArrayLike<any> {
        return [];
    }
}

/** Singleton instance of EmptySegment representing an empty segment */
export const empty: EmptySegment = new EmptySegment();

/** A non-empty segment containing a head element and a tail segment */
export class ASegment<T> implements Segment<T> {
    empty = false;

    constructor(public head: T, public tail: Segment<T>) {
    }

    [Symbol.iterator](): Iterator<T> {
        return iterator(this);
    }

    toString(): string {
        return toString(this);
    }

    toArray(): ArrayLike<T> {
        return Array.from(this);
    }
}

/** Creates a segment from optional head and tail values, returning empty segment if both undefined */
export function segment<T>(head: T | undefined = undefined, tail: Segment<T> | undefined = undefined): Segment<T> {
    if (head === undefined && tail === undefined) return empty;
    if (tail === undefined) return new ASegment<T>(head!, empty);
    return new ASegment(head!, tail);
}

/** Converts a segment to its string representation */
export function toString(segment: Segment<unknown>): string {
    if (segment.empty) return 'segment()';
    if (segment.tail.empty) return `segment(${segment.head})`;
    return `segment(${segment.head}, ${toString(segment.tail)})`
}

function* iterator<T>(segment: Segment<T>): Iterator<T> {
    while (!segment.empty) {
        yield segment.head;
        segment = segment.tail;
    }
}