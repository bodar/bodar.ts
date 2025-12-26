/** @module
 * Entry point for runtime
 * */
import {LazyMap} from "@bodar/yadic/LazyMap.ts";
import {chain} from "@bodar/yadic/chain.ts";
import {Throttle, type ThrottleStrategy} from "./Throttle.ts";
import {Idle} from "./Idle.ts";
import {BaseGraph} from "./BaseGraph.ts";
import {Backpressure, type BackpressureStrategy} from "./SharedAsyncIterable.ts";

export {display, Display} from './api/display.ts';
export {view, View} from './api/view.ts';
export {width, Width} from './api/width.ts';
export {input} from './api/input.ts';
export {event} from './api/event.ts';
export {observe} from './api/observe.ts';
export {mutable} from './api/mutable.ts';
export {now} from './api/now.ts';

export {BaseGraph} from './BaseGraph.ts'
export {Idle} from './Idle.ts'
export {Throttle} from './Throttle.ts'
export {JSX2DOM} from "@bodar/jsx2dom/JSX2DOM.ts";
export {chain} from "@bodar/yadic/chain.ts";

export interface RuntimeExports {
    throttle: ThrottleStrategy;
    backpressure: BackpressureStrategy;
    idle: Idle;
    graph: BaseGraph;
}

export function runtime<G = object>(global: G = globalThis as G): RuntimeExports & G {
    return chain(LazyMap.create()
        .set('backpressure', () => Backpressure.fastest)
        .set('idle', () => new Idle(Throttle.auto()))
        .set('throttle', ({idle}: {idle: Idle}) => idle.strategy)
        .set('graph', ({throttle, backpressure}: {
            throttle: ThrottleStrategy,
            backpressure: BackpressureStrategy
        }) => new BaseGraph(backpressure, throttle, global)), global as any);
}