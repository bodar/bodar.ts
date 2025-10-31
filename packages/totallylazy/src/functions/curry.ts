/**
 * Curries a function, enabling partial application while exposing applied arguments as properties.
 */
export function curry(fn: any, parameters: object = {}): any {
    return new Proxy(fn, new CurryHandler(parameters));
}

class CurryHandler<T extends Function> implements ProxyHandler<T> {
    constructor(private readonly parameters: object) {
    }

    apply(fn: T, self: any, args: any[]): any {
        const parameterNames = parametersOf(fn);
        const defaults = defaultParameters(fn);
        const properties = parameterNames.reduce((properties, name) => {
            if (Object.hasOwn(this.parameters, name)) Reflect.set(properties, name, Reflect.get(this.parameters, name));
            else if (args.length > 0) Reflect.set(properties, name, args.shift());
            else if (Object.hasOwn(defaults, name)) Reflect.set(properties, name, undefined);
            return properties;
        }, {});

        if (parameterNames.length === Object.keys(properties).length) return Reflect.apply(fn, self, Object.values(properties));
        return curry(fn, properties);
    }

    get(fn: T, p: string | symbol, receiver: any): any {
        if (Object.hasOwn(this.parameters, p)) return Reflect.get(this.parameters, p, receiver);
        return Reflect.get(fn, p, receiver);
    }
}

function rawParameters(fn: any) {
    const args: string = fn.toString().match(/\(([^)]*)\)/)[1];
    return args.split(',').map(arg => arg.trim());
}

function cleanUpName(name: string) {
    return name.replaceAll(/=.*/g, '').trim();
}

/**
 * Extract parameter names from a function.
 */
export function parametersOf(fn: any): string[] {
    return rawParameters(fn).map(cleanUpName);
}

/**
 * Extract parameter names from a function.
 */
export function defaultParameters(fn: any): Record<string, undefined> {
    return Object.fromEntries(rawParameters(fn).filter(v => v.includes('=')).map(cleanUpName).map(n => [n, undefined]));
}
