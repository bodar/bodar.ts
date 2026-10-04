/** @module
 * Functions that can be used inside a reactive element
 */

import {observe} from "./observe.ts";
import {findSlot} from "../html/SlotRenderer.ts";

/** Placeholder value - should be rewritten by the transformer */
export const width = -1;

/** Dependencies required by Width */
export interface WidthDependencies {
    reactiveRoot: Element;
    window: Window;
    ResizeObserver: typeof ResizeObserver;
}

/** Observes slot width changes using ResizeObserver */
export class Width {
    static for(key: string, deps: WidthDependencies): AsyncIterable<number> {
        const {reactiveRoot, window, ResizeObserver} = deps;
        const slot = findSlot(reactiveRoot, key);
        if (!slot) throw new Error(`Unable to find slot for ${key}`);
        if (window.getComputedStyle(slot).display === 'contents') slot.style.display = 'block';
        return observe((notify) => {
            let lastWidth = 0;
            const observer = new ResizeObserver(([entry]) => {
                const width = entry.contentRect.width;
                if (width === 0 || width === lastWidth) return;
                lastWidth = width;
                return notify(width);
            });
            observer.observe(slot);
            return () => observer.disconnect();
        })
    }
}