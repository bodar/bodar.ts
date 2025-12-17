/** @module
 * now generator function
 * */

/** A generator that yields the current timestamp (Date.now()) on every animation frame */
export function* now(): Generator<number> {
    while (true) {
        yield Date.now();
    }
}
