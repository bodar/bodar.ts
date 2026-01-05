/** @module
 * Functions that can be used inside a reactive element
 */
import {SlotRenderer, type SlotRendererDependencies} from "../html/SlotRenderer.ts";
import type {ThrottleStrategy} from "../Throttle.ts";

/** Values that can be rendered to a slot */
export type SupportedValue = Node | string | number;

/** Placeholder function - should be rewritten by the transformer */
export function display<T extends SupportedValue>(..._values: T[]): T[] {
    throw new Error('display() is a placeholder - it should have been rewritten by the transformer. Did you import it from @bodar/dataflow/runtime.ts?');
}

/** Contract for display function with value collection */
export interface DisplayContract {
    (...values: SupportedValue[]): SupportedValue[];

    key: string;
    values: SupportedValue[];
    pop: () => SupportedValue[];
    clear: () => void;
}

/** Dependencies required by Display */
export interface DisplayDependencies extends SlotRendererDependencies {
    throttle: ThrottleStrategy;
    reactiveRoot: HTMLElement;
}

/** Collects values and renders them to a named slot with throttling */
export class Display {
    public values: SupportedValue[] = [];
    private pending = false;

    constructor(private deps: DisplayDependencies, public key: string) {
    }

    call(...values: SupportedValue[]): SupportedValue[] {
        this.values.push(...values);
        if (!this.pending) {
            this.pending = true;
            this.deps.throttle().then(() => this.flush());
        }
        return values;
    }

    flush(): void {
        try {
            const updates = this.pop();
            const slot = this.deps.reactiveRoot.querySelector<HTMLSlotElement>(`slot[name="${this.key}"]`);
            if (slot) {
                new SlotRenderer(this.deps).render(slot, updates);
            }
        } finally {
            this.pending = false;
        }
    }

    pop(): SupportedValue[] {
        try {
            return this.values.slice();
        } finally {
            this.clear()
        }
    }

    clear(): void {
        this.values.length = 0
    }

    static for(key: string, deps: DisplayDependencies): DisplayContract {
        const display = new Display(deps, key);
        return Object.assign((...values: SupportedValue[]) => display.call(...values), display);
    }
}