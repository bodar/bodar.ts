import type {Predicate} from "./Predicate.ts";
import type {Mapper} from "../functions/Mapper.ts";
import {logical, type LogicalPredicate} from "./LogicalPredicate.ts";
import {isNotPredicate, not, type NotPredicate} from "./NotPredicate.ts";


/** A predicate that checks if the value extracted from <A> by the given mapper passes the given predicate */
export interface WherePredicate<A, B> extends LogicalPredicate<A> {
    readonly mapper: Mapper<A, B>;

    readonly predicate: Predicate<B>;
}

/** Creates a predicate that checks if the value extracted from <A> by the given mapper passes the given predicate */
export function where<A, B>(mapper: Mapper<A, B>, predicate: NotPredicate<B>): NotPredicate<A> ;
/** Creates a predicate that checks if the value extracted from <A> by the given mapper passes the given predicate */
export function where<A, B>(mapper: Mapper<A, B>, predicate: Predicate<B>): WherePredicate<A, B> ;
export function where<A, B>(mapper: Mapper<A, B>, predicate: Predicate<B>): Predicate<A> {
    if (isNotPredicate(predicate)) return not(where(mapper, predicate.predicate));
    return Object.assign(logical(function where(a: A) {
        return predicate(mapper(a));
    }), {
        mapper,
        predicate,
        toString: () => `where(${mapper}, ${predicate})`
    });
}

/** Checks if the given value is a WherePredicate */
export function isWherePredicate<A = any, B = any>(value: any): value is WherePredicate<A, B> {
    return typeof value === 'function' && value.name === 'where' && typeof value.mapper === 'function' && typeof value.predicate === 'function';
}