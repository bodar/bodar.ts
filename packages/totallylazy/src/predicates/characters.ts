import type {Predicate} from "./Predicate.ts";
import {or} from "./OrPredicate.ts";
import {between} from "./BetweenPredicate.ts";

export function among(characters:string): (char:string) => boolean {
    return (char: string) => characters.includes(char);
}

export function alphaNumeric(): Predicate<string> {
    return or(between('A', 'Z'), between('a', 'z'), between('0', '9'));
}

export function hexDigit(): Predicate<string> {
    return or(between('A', 'F'), between('a', 'f'), between('0', '9'));
}