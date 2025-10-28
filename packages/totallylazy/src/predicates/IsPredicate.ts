/** @module Predicate that checks if a value is of a specific type */
import type {Predicate} from "./Predicate.ts";
import {toString} from "../functions/toString.ts";

/** A predicate that checks if the value is equal to the given value using Object.is */
export interface IsPredicate<A> extends Predicate<A> {
    readonly value: A;
}

/** Creates a predicate that checks if the value is equal to the given value using Object.is */
export function is<A>(value: A): IsPredicate<A> {
    return Object.assign(function is(a: A) {
        return Object.is(a, value)
    }, {
        value: value,
        toString: () => `is(${toString(value)})`
    });
}

/** Checks if the given value is an IsPredicate */
export function isIsPredicate<A = any>(value: any): value is IsPredicate<A> {
    return typeof value === 'function' && value.name === 'is' && Object.hasOwn(value, 'value');
}
