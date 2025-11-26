/** @module
 * Functions that can be used inside a reactive element
 */

import {input, type SupportedInputs} from "./input.ts";
import {display, type SupportedValue} from "./display.ts";

export function view(value: HTMLElement): AsyncIterator<any> {
    return input(display(value as SupportedInputs));
}

view.pop = (): SupportedValue[]=> display.pop();

// TODO remove once we have proper build for script
export {display};