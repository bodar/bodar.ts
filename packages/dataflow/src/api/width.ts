/** @module
 * Functions that can be used inside a reactive element
 */

import {observe} from "./observe.ts";

/** Placeholder value - should be rewritten by the transformer */
export const width = -1;

export interface WidthDependencies {
    document: Document;
    window: Window;
    ResizeObserver: typeof ResizeObserver;
}

export class Width {
    static for(key: string, deps: WidthDependencies): AsyncIterable<number> {
        const {document, window, ResizeObserver} = deps;
        const slot = document.querySelector<HTMLSlotElement>(`slot[name="${key}"]`)!;
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