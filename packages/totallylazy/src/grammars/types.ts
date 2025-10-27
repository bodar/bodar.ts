/**
 * @module
 *
 * Type definitions for JSON values used in grammar parsing.
 */

/** Type representing a JSON array containing JsonValue elements */
export type JsonArray = JsonValue[];

/** Type representing a JSON object with string keys and JsonValue values */
export type JsonObject = { [key: string]: JsonValue };

/** Type representing any valid JSON value: null, boolean, string, number, array, or object */
export type JsonValue = null | boolean | string | number | JsonArray | JsonObject;

