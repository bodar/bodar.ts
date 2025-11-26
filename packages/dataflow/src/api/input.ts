import {iterator} from "../Iterator.ts";

export type SupportedInputs = HTMLInputElement | HTMLSelectElement;

export function input(element: SupportedInputs): AsyncIterator<any> {
    return iterator((notify) =>
        element.addEventListener(eventOf(element), () => notify(valueOf(element))), valueOf(element));
}

function valueOf(element: SupportedInputs): any {
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

function eventOf(element: SupportedInputs): 'click' | 'change' | 'input' {
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
