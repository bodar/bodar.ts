import type {Predicate} from "./Predicate.ts";

/**
 * A predicate that checks if a character is among the given characters
 */
export interface AmongPredicate extends Predicate<string> {
    /** The set of characters to check against */
    readonly characters: string;
}

/**
 * Creates a predicate that checks if a character is among the given characters
 */
export function among(characters: string): AmongPredicate {
    return Object.assign(function among(char: string) {
        return characters.includes(char);
    }, {
        characters,
        toString: () => `among('${characters}')`
    });
}

/**
 * Checks if the given value is an AmongPredicate
 */
export function isAmongPredicate(value: any): value is AmongPredicate {
    return typeof value === 'function' && value.name === 'among' && typeof value.characters === 'string';
}