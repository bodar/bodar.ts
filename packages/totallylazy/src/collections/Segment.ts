import {NoSuchElement} from "../errors/NoSuchElement.ts";

export interface Segment<T> extends Iterable<T> {
    empty: boolean;

    head: T;

    tail: Segment<T>;

    toString(): string;

    toArray(): ArrayLike<T>;
}

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

export const empty = new EmptySegment();

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

export function segment<T>(head: T | undefined = undefined, tail: Segment<T> | undefined = undefined): Segment<T> {
    if (head === undefined && tail === undefined) return empty;
    if (tail === undefined) return new ASegment<T>(head!, empty);
    return new ASegment(head!, tail);
}

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