export interface Source<T> {
    readonly length: number;

    at(index: number): T | undefined;

    slice(start?: number, end?: number): Source<T>;
}

export interface View<A> extends Source<A> {
    isEmpty(): boolean;

    slice(start?: number, end?: number): View<A>;

    toSource(): Source<A>;
}

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


export function view<A>(values: Source<A>): ArrayView<A> {
    return new ArrayView(values);
}