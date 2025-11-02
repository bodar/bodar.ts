import type {_} from "./curry.ts";

export type Fn = (...args: any[]) => any;

export type Placeholder = typeof _;

export type AllowPlaceholder<T extends any[]> = {
    [K in keyof T]: T[K] | Placeholder;
};

export type RequiredFirstParam<F extends Fn> =
    Parameters<F> extends [infer Head, ...infer Tail]
        ? [Head | Placeholder, ...Partial<AllowPlaceholder<Tail>>]
        : [];

export type RemainingParameters<AppliedParams extends any[], ExpectedParams extends any[]> =
    AppliedParams extends [infer AHead, ...infer ATail]
        ? ExpectedParams extends [infer EHead, ...infer ETail]
            ? AHead extends Placeholder
                ? [EHead, ...RemainingParameters<ATail, ETail>]
                : RemainingParameters<ATail, ETail>
            : []
        : ExpectedParams;

export type Curried<F extends Fn, Accumulated extends any[] = []> =
    <AppliedParams extends RequiredFirstParam<F>>(...args: AppliedParams) =>
        RemainingParameters<AppliedParams, Parameters<F>> extends [any, ...any[]]
            ? (Curried<(...args: RemainingParameters<AppliedParams, Parameters<F>>) => ReturnType<F>, [...Accumulated, ...AppliedParams]>) & {readonly [key:string]: [...Accumulated, ...AppliedParams][number]}
            : ReturnType<F>;
