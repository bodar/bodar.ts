/**
 * A source of indexed elements
 */
export interface Source<T> {
    readonly length: number;

    at(index: number): T | undefined;

    slice(start?: number, end?: number): Source<T>;
}

/**
 * A view into a source that can be efficiently sliced without copying
 */
export interface View<A> extends Source<A> {
    isEmpty(): boolean;

    slice(start?: number, end?: number): View<A>;

    toSource(): Source<A>;
}

/**
 * An efficient view into an array that uses offset and length instead of copying
 */
export class ArrayView<A> implements View<A> {
    constructor(public readonly values: Source<A>,
                public readonly offset: number = 0,
                public readonly length: number = values.length - offset) {
    }

    isEmpty(): boolean {
        return this.length === 0;
    }

    at(index: number): A | undefined {
        if (index >= this.length) return undefined;
        return this.values.at(this.offset + index);
    }

    slice(start: number = 0, end: number = this.length): ArrayView<A> {
        const offset = this.offset + start;
        const limit = end - start;
        return new ArrayView(this.values, offset, limit);
    }

    toSource(): Source<A> {
        return this.values.slice(this.offset, this.offset + this.length);
    }
}

/**
 * Creates a view from a source
 *
 * @example
 * ```ts
 * const v = view([1, 2, 3, 4, 5]);
 * v.slice(1, 3); // View of [2, 3] without copying
 * ```
 */
export function view<A>(values: Source<A>): ArrayView<A> {
    return new ArrayView(values);
}