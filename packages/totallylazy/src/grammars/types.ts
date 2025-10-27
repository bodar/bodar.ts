/**
 * @module
 *
 * Type definitions for JSON values used in grammar parsing.
 */

export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = null | boolean | string | number | JsonArray | JsonObject;

