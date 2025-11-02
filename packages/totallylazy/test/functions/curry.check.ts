import {assertType, type Equal} from "asserttt";
import type {Placeholder, RemainingParameters, RequiredFirstParam} from "../../src/functions/curry.ts";


/*
RequiredFirstParam should allow Placeholders
 */
assertType<Equal<
    RequiredFirstParam<(arg1: string, arg2: string, arg3: number) => void>,
    [string | Placeholder, arg2?: string | Placeholder | undefined, arg3?: number | Placeholder | undefined]
>>(true);

/*
RemainingParameters should take away applied from expected
 */
assertType<Equal<
    RemainingParameters<[string, number], [string, number, number, Symbol]>,
    [number, Symbol]
>>(true);


/*
RemainingParameters should ignore placeholders
 */
assertType<Equal<
    RemainingParameters<[Placeholder, number], [string, number, Symbol]>,
    [string, Symbol]
>>(true);