/** @module Functions to support extracting parameters from function signatures */

const parameterPattern = /\(([^)]*)\)/;

/** Parse all the Parameters of a function */
export function parametersOf(fn: Function): Parameter[] {
    const match = fn.toString().match(parameterPattern);
    if (match === null) return [];
    const args: string = match[1];
    return args.split(',')
        .map(arg => arg.split('=').map(v => v.trim()))
        .map(p => Reflect.construct(Parameter, p));
}

/** A parameter class that contains the name and defaultValue of a parameter to a function */
export class Parameter {
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