import type {_} from "./curry.ts";

export type Fn = (...args: any[]) => any;

export type RequiredFirstParam<F extends Fn> =
    Parameters<F> extends [infer Head, ...infer Tail]
        ? [Head, ...Partial<Tail>]
        : [];

export type RemainingParameters<AppliedParams extends any[], ExpectedParams extends any[]> =
    AppliedParams extends [any, ...infer ATail]
        ? ExpectedParams extends [any, ...infer ETail]
            ? RemainingParameters<ATail, ETail>
            : []
        : ExpectedParams;

export type Curried<F extends Fn, Accumulated extends any[] = []> =
    <AppliedParams extends RequiredFirstParam<F>>(...args: AppliedParams) =>
        RemainingParameters<AppliedParams, Parameters<F>> extends [any, ...any[]]
            ? (Curried<(...args: RemainingParameters<AppliedParams, Parameters<F>>) => ReturnType<F>, [...Accumulated, ...AppliedParams]>) & {readonly [key:string]: [...Accumulated, ...AppliedParams][number]}
            : ReturnType<F>;

export type Placeholder = typeof _;