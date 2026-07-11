/**
 * @module
 *
 * SQLite `json_each(col)` table-valued function, for iterating a JSON object/array
 * column as rows. Compose with an alias and a FROM/JOIN at the call site.
 */

import {functionCall, FunctionCall} from "../ansi/FunctionCall.ts";
import type {Expression} from "../template/Expression.ts";

/** Creates a SQLite `json_each(column)` table-valued function reference. */
export function jsonEach(column: Expression): FunctionCall {
    return functionCall('json_each', column);
}
