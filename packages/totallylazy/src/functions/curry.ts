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
        const parameters = parametersOf(fn);
        const properties = parameters.reduce((properties, {name, hasDefault}) => {
            if (Object.hasOwn(this.parameters, name)) Reflect.set(properties, name, Reflect.get(this.parameters, name));
            else if (args.length > 0) Reflect.set(properties, name, args.shift());
            else if (hasDefault) Reflect.set(properties, name, undefined);
            return properties;
        }, {});

        if (parameters.length === Object.keys(properties).length) return Reflect.apply(fn, self, Object.values(properties));
        return curry(fn, properties);
    }

    get(fn: T, p: string | symbol, receiver: any): any {
        if (Object.hasOwn(this.parameters, p)) return Reflect.get(this.parameters, p, receiver);
        return Reflect.get(fn, p, receiver);
    }
}

export function parametersOf(fn: any): Parameter[] {
    const args: string = fn.toString().match(/\(([^)]*)\)/)[1];
    return args.split(',')
        .map(arg => arg.split('=').map(v => v.trim()))
        .map(p => Reflect.construct(Parameter, p));
}

class Parameter {
    constructor(public readonly name: string, public readonly defaultValue?: string) {
    }

    get hasDefault() {
        return this.defaultValue;
    }
}

export function parameter(name: string, defaultValue?: string) {
    return new Parameter(name, defaultValue);
}