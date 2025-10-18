import type {Predicate} from "./Predicate.ts";
import {or} from "./OrPredicate.ts";
import {between} from "./BetweenPredicate.ts";
import {among} from "./AmongPredicate.ts";

export const digit: Predicate<string> = between('0', '9');

export const letter: Predicate<string> = or(between('a', 'z'), between('A', 'Z'));

export const alphaNumeric: Predicate<string> = or(letter, digit);

export const hexDigit: Predicate<string> = or(between('A', 'F'), between('a', 'f'), digit);

export const whitespace: Predicate<string> = among(' \t\n\r\f\v');