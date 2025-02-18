export interface Constant<T> {
    (..._ignored: any[]): T;

    value: T;
}

export function constant<T>(value: T): Constant<T> {
    return Object.assign(function constant(..._ignored: any[]) {
        return value;
    }, {
        value,
        toString: () => `constant(${value})`
    });
}

export function isConstant<T = any>(value: any): value is Constant<T> {
    return typeof value === 'function' && value.name === 'constant' && Object.hasOwn(value, 'value');
}

export const alwaysTrue: Constant<true> = constant(true);

export const alwaysFalse: Constant<false> = constant(false);
