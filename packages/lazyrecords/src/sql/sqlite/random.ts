/**
 * @module
 *
 * SQLite `random()` scalar function, typically used as an ORDER BY key to shuffle rows.
 */

import {functionCall, FunctionCall} from "../ansi/FunctionCall.ts";

/** Creates a SQLite `random()` function call. */
export function random(): FunctionCall {
    return functionCall('random');
}
