import {assertType, type Equal} from "asserttt";
import type {Placeholder, RemainingParameters, RequiredFirstParam} from "../../src/functions/curry.types.ts";

/*
type Params = Parameters<(a: number, b: number) => number>;
// Params has type [a: number, b: number]
 */
assertType<Equal<
    Parameters<(a: number, b: number) => number>,
    [a: number, b: number]
>>(true);

/*
type PartialList = Partial<[string, number, Symbol]>
// PartialList has type [(string | undefined)?, (number | undefined)?, (Symbol | undefined)?]
 */
assertType<Equal<
    Partial<[string, number, Symbol]>,
    [(string | undefined)?, (number | undefined)?, (Symbol | undefined)?]
>>(true);


/*
type FirstElemRequired = RequiredFirstParam<(arg1: string, arg2: string, arg3: number) => void>
// FirstElemRequired type is [string, arg2?: string | undefined, arg3?: number | undefined]
 */
assertType<Equal<
    RequiredFirstParam<(arg1: string, arg2: string, arg3: number) => void>,
    [string, arg2?: string | undefined, arg3?: number | undefined]
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