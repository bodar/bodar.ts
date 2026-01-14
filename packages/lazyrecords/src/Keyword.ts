/**
 * @module
 *
 * Keyword type for defining typed record fields with runtime type information.
 * Similar to totallylazy Property but includes runtime type marker for schema generation.
 */

import type {Property} from "@bodar/totallylazy/functions/Property.ts";

/**
 * A Keyword extends Property with runtime type information.
 * Used for schema operations where we need to map TypeScript types to SQL types.
 *
 * @example
 * ```typescript
 * interface User { id: number; name: string; active: boolean; }
 *
 * const id = keyword<User, 'id'>('id', Number);
 * const name = keyword<User, 'name'>('name', String);
 * const active = keyword<User, 'active'>('active', Boolean);
 * ```
 */
export interface Keyword<A, K extends keyof A> extends Property<A, K> {
    /** The property key */
    readonly key: K;
    /** The JavaScript constructor type (Number, String, Boolean, Date, etc.) used as runtime marker */
    readonly type: Function;
}

/**
 * Creates a Keyword that extracts a value from an object and carries runtime type information.
 *
 * @param key - The property key to extract
 * @param type - The JavaScript constructor representing the type (Number, String, Boolean, Date, etc.)
 * @returns A Keyword function with key and type metadata
 */
export function keyword<A, K extends keyof A>(
    key: K,
    type: Function
): Keyword<A, K> {
    return Object.assign(function keyword(a: A) {
        return a[key];
    }, {
        key,
        type,
        toString: () => `keyword('${String(key)}', ${type.name})`
    });
}

/** Type guard to check if a value is a Keyword */
export function isKeyword<A = any, K extends keyof A = any>(value: any): value is Keyword<A, K> {
    return typeof value === 'function' &&
        value.name === 'keyword' &&
        Object.hasOwn(value, 'key') &&
        Object.hasOwn(value, 'type');
}
