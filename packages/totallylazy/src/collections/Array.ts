export type ArrayContains<A, B> = Extract<A | B, B>[];
export type ReadonlyArrayContains<A, B> = readonly Extract<A | B, B>[];

// export type Head<T extends any[]> = T extends [infer HEAD, ...infer IGNORE] ? HEAD : never;
// export type Tail<T extends any[]> = T extends [infer IGNORE, ...infer TAIL] ? TAIL : never;

// export type Init<T extends any[]> = T extends [...infer INIT, any] ? INIT : never;
// export type Last<T extends any[]> = T extends [...infer IGNORE, infer LAST] ? LAST : never;
