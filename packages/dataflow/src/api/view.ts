import {input, type SupportedInputs} from "./input.ts";
import {display, type SupportedValue} from "./display.ts";

export function view(value: SupportedInputs): AsyncIterator<any> {
    return input(display(value));
}

view.pop = (): SupportedValue[]=> display.pop();