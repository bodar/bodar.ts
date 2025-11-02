import {assertType, type Equal} from "asserttt";
import type {Placeholder, RemainingParameters, RequiredFirstParam} from "../../src/functions/curry.types.ts";


/*

 */
assertType<Equal<
    RequiredFirstParam<(arg1: string, arg2: string, arg3: number) => void>,
    [string | Placeholder, arg2?: string | Placeholder | undefined, arg3?: number | Placeholder | undefined]
>>(true);

/*
type Remaining = RemainingParameters<[string, number], [string, number, number, Symbol]>
// Remaining has type [number, Symbol]
 */
assertType<Equal<
    RemainingParameters<[string, number], [string, number, number, Symbol]>,
    [number, Symbol]
>>(true);


/*
type Remaining = RemainingParameters<[string, number], [string, number, number, Symbol]>
// Remaining has type [number, Symbol]
 */
assertType<Equal<
    RemainingParameters<[Placeholder, number], [string, number, Symbol]>,
    [string, Symbol]
>>(true);