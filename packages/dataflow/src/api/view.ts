/** @module
 * Functions that can be used inside a reactive element
 */

import {input, type SupportedInputs} from "./input.ts";
import {Display, type DisplayDependencies} from "./display.ts";

/** Placeholder function - should be rewritten by the transformer */
export function view(_value: HTMLElement): AsyncIterator<any> {
    throw new Error('view() is a placeholder - it should have been rewritten by the transformer. Did you import it from @bodar/dataflow/runtime.ts?');
}

export interface ViewContract {
    (value: HTMLElement): AsyncIterator<any>;
}

export class View {
    static for(key: string, deps: DisplayDependencies): ViewContract {
        const display = Display.for(key, deps);
        return (value: HTMLElement) => {
            return input(display(value as SupportedInputs));
        };
    }
}