/** @module
 * Compiles a plain JS module's JSX to PositionalJSX elements, so helpers in modules (e.g. `(jsx, item) => <li>…</li>`)
 * keep their DOM across re-runs like block JSX. Call sites are prefixed with `id` so modules never share one.
 * Strip TypeScript first (e.g. with tsc's transpileModule and jsx: preserve): blocks and this transform take plain JS.
 */
import {parseScript, toScript} from "../javascript/script-parsing.ts";
import {transformJSX} from "./transformer.ts";

/** JS with JSX in, JS with `jsx.element("<id>@<offset>", …)` calls out */
export function transformModuleJSX(javascript: string, id: string): string {
    return toScript(transformJSX(parseScript(javascript), {sitePrefix: id}));
}
