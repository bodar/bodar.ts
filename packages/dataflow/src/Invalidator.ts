/**
 * Extensible invalidation rules for cleaning up reactive node values
 * @module
 */

/** A rule that matches values and handles their cleanup */
export type InvalidationRule = {
    predicate: (value: any) => boolean;
    handler: (value: any) => void;
};

/** Default rules - null check first, then built-in disposal patterns */
const defaultRules: InvalidationRule[] = [
    {predicate: v => v === undefined || v === null, handler: () => {}},
    {predicate: v => v instanceof AbortController, handler: v => v.abort()},
    {predicate: v => typeof v[Symbol.dispose] === 'function', handler: v => v[Symbol.dispose]()},
    {predicate: v => typeof v[Symbol.asyncDispose] === 'function', handler: v => v[Symbol.asyncDispose]()},
];

/** Manages cleanup rules for invalidating reactive values */
export class Invalidator {
    constructor(private rules: InvalidationRule[] = [...defaultRules]) {}

    /** Add a custom cleanup rule */
    add(predicate: (value: any) => boolean, handler: (value: any) => void): this {
        this.rules.push({predicate, handler});
        return this;
    }

    /** Invalidate a value by finding and executing the first matching rule */
    invalidate(value: any): void {
        try {
            for (const {predicate, handler} of this.rules) {
                if (predicate(value)) {
                    handler(value);
                    return;
                }
            }
        } catch (e) {
            console.error('Error during invalidate:', e);
        }
    }
}
