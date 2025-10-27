import type {Result} from "./Result.ts";
import {toString} from "../functions/toString.ts";

export class Failure<A, B> implements Result<A, B> {
    constructor(public expected: any, public actual: any) {
    }

    get value(): never {
        throw new Error(this.toString());
    }

    get remainder(): never {
        throw new Error(this.toString());
    }

    toString(): string {
        return "Expected " + toString(this.expected) + " but was " + toString(this.actual);
    }

    * [Symbol.iterator](): Iterator<B> {
    }
}

export function failure(expected: any, actual: any): Result<any, any> {
    return new Failure(expected, actual);
}

export function fail(expected: any, actual: any): Result<any, any> {
    return new Failure(expected, actual);
}