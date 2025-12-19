/** @module
 * Functions that can be used inside a reactive element
 */

import {input, type SupportedInputs} from "./input.ts";
import {Display, display, type SupportedValue} from "./display.ts";

export function view(value: HTMLElement): AsyncIterator<any> {
    return input(display(value as SupportedInputs));
}

view.pop = (): SupportedValue[]=> display.pop();

export interface ViewContract {
    (value: HTMLElement): AsyncIterator<any>;
}

export class View {
    static for(key: string): ViewContract {
        return (value: HTMLElement) => {
            return input(Display.for(key)(value as SupportedInputs));
        };
    }
}