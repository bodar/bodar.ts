/** @module
 * Functions that can be used inside a reactive element
 */

export type SupportedValue = Node | string | number;

export function display<T extends SupportedValue>(value: T): T {
    display.values.push(value);
    return value;
}

display.prefix = '_display_';
display.values = [] as SupportedValue[];
display.clear = () => {
    display.values.length = 0;
}
display.format = (key: string) => display.prefix + key
display.pop = (): SupportedValue[]=> {
    try {
        return display.values.slice();
    } finally {
        display.clear();
    }
}