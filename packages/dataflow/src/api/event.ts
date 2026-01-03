import {observe} from "./observe.ts";

export function event<E extends EventTarget, EV extends Event, R>(element: E,
                                                                  event: string,
                                                                  value: (event: EV) => R,
                                                                  initialValue?: R): AsyncIterator<R> {
    return observe((notify) => {
        const handler = (ev: any) => notify(value(ev));
        element.addEventListener(event, handler);
        return () => element.removeEventListener(event, handler);
    }, initialValue);
}