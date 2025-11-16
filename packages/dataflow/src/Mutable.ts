import {observe} from "./observe.ts";

export interface Mutable<T> extends AsyncGenerator<T> {
    value: T
}

export function Mutable<T>(value: T): Mutable<T> {
    let change: any;
    return Object.defineProperty(
        observe((_: any) => {
            change = _;
            if (value !== undefined) change(value);
        }) as any,
        "value",
        {
            get: () => value,
            set: (x) => void change((value = x))
        }
    );
}