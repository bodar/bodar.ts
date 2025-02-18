import type {Result} from "./Result.ts";
import type {View} from "./View.ts";

export class Success<A, B> implements Result<A, B> {
    constructor(public value: B, public remainder: View<A>) {
    }

    * [Symbol.iterator](): Iterator<B> {
        yield this.value;
    }

    toString(): string {
        return `Success(${this.value}, ${this.remainder.toSource()})`;
    }
}

export function success<A, B>(value: B, remainder: View<A>): Result<A, B> {
    return new Success(value, remainder);
}