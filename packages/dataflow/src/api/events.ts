import {end, observe} from "./observe.ts";

export function events<E extends EventTarget, EV extends Event, R>(element: E,
                                                                   event: string,
                                                                   value: (event: EV) => R,
                                                                   initialValue?: R | typeof end): AsyncIterator<R> {
    return observe<R>((notify) => {
        const handler = (ev: any) => notify(value(ev));
        element.addEventListener(event, handler);
        return () => element.removeEventListener(event, handler);
    }, arguments.length > 3 ? initialValue : end);
}