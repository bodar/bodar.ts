/** @module
 * Functions that can be used inside a reactive element
 */
import {SlotRenderer, type SlotRendererDependencies} from "../html/SlotRenderer.ts";
import type {ThrottleStrategy} from "../Throttle.ts";

export type SupportedValue = Node | string | number;

/** Placeholder function - should be rewritten by the transformer */
export function display<T extends SupportedValue>(_value: T): T {
    throw new Error('display() is a placeholder - it should have been rewritten by the transformer. Did you import it from @bodar/dataflow/runtime.ts?');
}

export interface DisplayContract {
    <T extends SupportedValue>(value: T): T;

    key: string;
    values: SupportedValue[];
    pop: () => SupportedValue[];
    clear: () => void;
}

export interface DisplayDependencies extends SlotRendererDependencies {
    throttle: ThrottleStrategy;
}

export class Display {
    public values: SupportedValue[] = [];
    private pending = false;

    constructor(private deps: DisplayDependencies, public key: string) {
    }

    call(value: any): any {
        this.values.push(value);
        if (!this.pending) {
            this.pending = true;
            this.deps.throttle().then(() => this.flush());
        }
        return value;
    }

    flush(): void {
        try {
            const updates = this.pop();
            if (updates.length > 0) {
                const slot = this.deps.document.querySelector<HTMLSlotElement>(`slot[name="${this.key}"]`);
                if (slot) {
                    new SlotRenderer(this.deps).render(slot, updates);
                }
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

    private static instances = new Map<string, WeakRef<DisplayContract>>();

    static for(key: string, deps: DisplayDependencies): DisplayContract {
        const instance = this.instances.get(key)?.deref();
        if (instance) return instance;
        const display = new Display(deps, key);
        const newInstance = Object.assign((value: any) => display.call(value), display);
        this.instances.set(key, new WeakRef(newInstance));
        return newInstance;
    }

    static delete(key: string): boolean {
        return this.instances.delete(key);
    }

    static deleteAll(): void {
        this.instances.clear();
    }
}