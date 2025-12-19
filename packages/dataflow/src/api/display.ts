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
display.clear = (): void => {
    display.values.length = 0;
}
display.format = (key: string): string => display.prefix + key
display.pop = (): SupportedValue[] => {
    try {
        return display.values.slice();
    } finally {
        display.clear();
    }
}

export interface DisplayContract {
    <T extends SupportedValue>(value: T): T;

    key: string;
    values: SupportedValue[];
    pop: () => SupportedValue[];
    clear: () => void;
}

export class Display {
    private static instances = new Map<string, DisplayContract>();

    private static create(key: string): DisplayContract {
        const values: SupportedValue[] = [];
        return Object.assign((value: any) => {
            values.push(value);
            return value;
        }, {
            key,
            values,
            pop: (): SupportedValue[] => {
                try {
                    return values.slice();
                } finally {
                    values.length = 0;
                }
            },
            clear: () => values.length = 0
        });
    }

    static for(key: string): DisplayContract {
        if (this.instances.has(key)) return this.instances.get(key)!;
        const instance = this.create(key);
        this.instances.set(key, instance);
        return instance;
    }
}