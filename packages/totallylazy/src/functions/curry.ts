/** @module Functions to support currying functions */

/**
 * Curries a function, enabling partial application while exposing applied arguments as properties.
 * Can optionally be used to bind the supplied parameters onto the function
 */
export function curry(fn: any, parameters: object = {}): any {
    return create(fn, parameters, parametersOf(fn));
}

function create(fn: any, parameters: object, parametersSignature: Parameter[]) {
    return new Proxy(fn, new CurryHandler(parameters, parametersSignature));
}

class CurryHandler<T extends Function> implements ProxyHandler<T> {
    constructor(private readonly parameters: object, private readonly parametersSignature: Parameter[]) {
    }

    apply(fn: T, self: any, args: any[]): any {
        const properties = this.parametersSignature.reduce((properties, {name, hasDefault}) => {
            if (Object.hasOwn(this.parameters, name)) Reflect.set(properties, name, Reflect.get(this.parameters, name));
            else if (args.length > 0) Reflect.set(properties, name, args.shift());
            else if (hasDefault) Reflect.set(properties, name, undefined);
            return properties;
        }, {});

        if (this.parametersSignature.length === Object.keys(properties).length) return Reflect.apply(fn, self, Object.values(properties));
        return create(fn, properties, this.parametersSignature);
    }

    get(fn: T, p: string | symbol, receiver: any): any {
        if (Object.hasOwn(this.parameters, p)) return Reflect.get(this.parameters, p, receiver);
        return Reflect.get(fn, p, receiver);
    }
}

const parameterPattern = /\(([^)]*)\)/;

/** Parse all the Parameters of a function */
export function parametersOf(fn: any): Parameter[] {
    const args: string = fn.toString().match(parameterPattern)[1];
    return args.split(',')
        .map(arg => arg.split('=').map(v => v.trim()))
        .map(p => Reflect.construct(Parameter, p));
}

class Parameter {
    constructor(public readonly name: string, public readonly defaultValue?: string) {
    }

    get hasDefault(): boolean {
        return !!this.defaultValue;
    }
}

/** Constructor function to create a Parameter class */
export function parameter(name: string, defaultValue?: string): Parameter {
    return new Parameter(name, defaultValue);
}