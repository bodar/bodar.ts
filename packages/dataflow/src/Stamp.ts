/**
 * Logical timestamps that let a join tell a consistent set of inputs from a glitch
 * @module
 */

/** For each upstream node, how many values it had yielded when this value was derived */
export type Stamp = ReadonlyMap<object, number>;

/** A value carrying the stamp of the upstream values it was derived from */
export interface Stamped<T> {
    value: T;
    stamp: Stamp;
}

/** The empty stamp: derived from nothing */
export const empty: Stamp = new Map();

/** Union of stamps, keeping the highest count for each node */
export function merge(stamps: Iterable<Stamp>): Stamp {
    const result = new Map<object, number>();
    for (const stamp of stamps) {
        for (const [node, count] of stamp) {
            if (count > (result.get(node) ?? -Infinity)) result.set(node, count);
        }
    }
    return result;
}

/**
 * Indexes of the stamps that are behind another stamp on a node they share.
 * Inputs that share no node never wait for each other.
 * Empty means the stamps are consistent.
 */
export function lagging(stamps: (Stamp | undefined)[]): Set<number> {
    const latest = merge(stamps.filter(s => s !== undefined));
    const result = new Set<number>();
    stamps.forEach((stamp, index) => {
        if (!stamp) return;
        for (const [node, count] of stamp) {
            if (count < latest.get(node)!) {
                result.add(index);
                return;
            }
        }
    });
    return result;
}
