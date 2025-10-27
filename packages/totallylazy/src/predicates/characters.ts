import type {Predicate} from "./Predicate.ts";
import {or} from "./OrPredicate.ts";
import {between} from "./BetweenPredicate.ts";
import {among} from "./AmongPredicate.ts";

/**
 * Predicate that matches decimal digits (0-9)
 */
export const digit: Predicate<string> = between('0', '9');

/**
 * Predicate that matches letters (a-z, A-Z)
 */
export const letter: Predicate<string> = or(between('a', 'z'), between('A', 'Z'));

/**
 * Predicate that matches alphanumeric characters (letters and digits)
 */
export const alphaNumeric: Predicate<string> = or(letter, digit);

/**
 * Predicate that matches hexadecimal digits (0-9, A-F, a-f)
 */
export const hexDigit: Predicate<string> = or(between('A', 'F'), between('a', 'f'), digit);

/**
 * Predicate that matches whitespace characters (space, tab, newline, carriage return, form feed, vertical tab)
 */
export const whitespace: Predicate<string> = among(' \t\n\r\f\v');