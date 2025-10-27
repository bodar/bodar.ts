/**
 * @module
 *
 * Array-backed segment implementation providing efficient head/tail access over array-like structures.
 */

import {NoSuchElement} from "../errors/NoSuchElement.ts";
import {empty, type Segment, toString} from "./Segment.ts";
import {characters} from "../functions/characters.ts";

export class ArraySegment<T> implements Segment<T> {
    constructor(public array: ArrayLike<T>, public index: number = 0) {
    }

    get empty(): boolean {
        return this.index >= this.array.length
    }

    get head(): T {
        if (this.empty) throw new NoSuchElement();
        return this.array[this.index];
    }

    get tail(): Segment<T> {
        return this.array.length > this.index + 1 ? new ArraySegment(this.array, this.index + 1) : empty;
    }

    * [Symbol.iterator](): Iterator<T> {
        for (let i = this.index; i < this.array.length; i++) {
            yield this.array[i];
        }
    }

    toString(): string {
        return toString(this);
    }

    toArray(): ArrayLike<T> {
        if (this.index === 0) return this.array;
        if ('subarray' in this.array && typeof this.array.subarray === "function") return this.array.subarray(this.index);
        if ('slice' in this.array && typeof this.array.slice === "function") return this.array.slice(this.index);
        return Array.prototype.slice.call(this.array, this.index);
    }
}

/**
 * Creates a Segment from an array-like object
 *
 * @param array - The array-like object to create a segment from
 * @returns A Segment providing lazy head/tail access over the array
 *
 * @example
 * ```typescript
 * const seg = fromArray([1, 2, 3]);
 * seg.head; // 1
 * seg.tail.head; // 2
 *
 * const bytes = new Uint8Array([72, 69, 76, 76, 79]);
 * const byteSeg = fromArray(bytes);
 * byteSeg.head; // 72
 * ```
 */
export function fromArray<T>(array: ArrayLike<T>): Segment<T> {
    return new ArraySegment(array);
}

/**
 * Creates a Segment from a string by splitting it into characters
 *
 * @param value - The string to create a segment from
 * @returns A Segment providing lazy head/tail access over the characters
 *
 * @example
 * ```typescript
 * const seg = fromString("HELLO");
 * seg.head; // 'H'
 * seg.tail.head; // 'E'
 * Array.from(seg); // ['H', 'E', 'L', 'L', 'O']
 * ```
 */
export function fromString(value: string): Segment<string> {
    return fromArray(characters(value));
}

