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

export function fromArray<T>(array: ArrayLike<T>): Segment<T> {
    return new ArraySegment(array);
}

export function fromString(value: string): Segment<string> {
    return fromArray(characters(value));
}

