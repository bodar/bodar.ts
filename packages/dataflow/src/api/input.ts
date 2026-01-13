/** @module
 * Functions that can be used inside a reactive element
 */


import {events} from "./events.ts";

/** Input elements supported by the input function */
export type SupportedInputs = HTMLInputElement | HTMLSelectElement;

/** Creates an AsyncIterator that yields input element values on change */
export function input<E extends SupportedInputs, R>(element: E, eventType: string = eventOf(element), value: (i: E) => R = valueOf): AsyncIterator<R> {
    return events(element, eventType, () => value(element), value(element));
}

function valueOf(element: any): any {
    switch (element.type) {
        case "range":
        case "number":
            return element.valueAsNumber;
        case "date":
            return element.valueAsDate;
        case "checkbox":
            return element.checked;
        case "file":
            return element.multiple ? element.files : element.files![0];
        case "select-multiple":
            return Array.from((element as HTMLSelectElement).selectedOptions, (o) => o.value);
        default:
            return element.value;
    }
}

function eventOf(element: any): 'click' | 'change' | 'input' {
    switch (element.type) {
        case "button":
        case "submit":
        case "checkbox":
            return "click";
        case "file":
            return "change";
        default:
            return "input";
    }
}
