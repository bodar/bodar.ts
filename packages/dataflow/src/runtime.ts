/** @module
 * Entry point for runtime
 * */
import {LazyMap} from "@bodar/yadic/LazyMap.ts";
import {chain} from "@bodar/yadic/chain.ts";
import {Throttle, type ThrottleStrategy} from "./Throttle.ts";
import {Idle} from "./testing/Idle.ts";
import {BaseGraph} from "./BaseGraph.ts";
import {Backpressure, type BackpressureStrategy} from "./SharedAsyncIterable.ts";
import {Invalidator} from "./Invalidator.ts";

export {display, Display} from './api/display.ts';
export {view, View} from './api/view.ts';
export {width, Width} from './api/width.ts';
export {input} from './api/input.ts';
export {event} from './api/event.ts';
export {observe} from './api/observe.ts';
export {mutable} from './api/mutable.ts';
export {now} from './api/now.ts';
export {raw} from './api/raw.ts';

export {BaseGraph} from './BaseGraph.ts'
export {Idle} from './testing/Idle.ts'
export {Throttle} from './Throttle.ts'
export {Invalidator} from './Invalidator.ts'
export {JSX2DOM, autoKeyEvents} from "@bodar/jsx2dom/JSX2DOM.ts";
export {chain} from "@bodar/yadic/chain.ts";

/** Dependencies and services provided by the runtime */
export interface RuntimeExports {
    throttle: ThrottleStrategy;
    backpressure: BackpressureStrategy;
    invalidator: Invalidator;
    graph: BaseGraph;
    idle?: Idle;
}

export type RuntimeConfig = Partial<{
    scriptId: string;
    idle: boolean;
}>

/** Creates a runtime with lazy-initialized dependencies */
export function runtime(config: RuntimeConfig = {}, global: typeof globalThis  = globalThis): RuntimeExports & typeof globalThis {
    const base = config.idle ?
        LazyMap.create()
            .set('idle', () => new Idle(Throttle.auto()))
            .set('throttle', ({idle}) => idle.strategy) :
        LazyMap.create()
            .set('throttle', () => Throttle.auto())

    return chain(base
        .set('reactiveRoot', () => config.scriptId ? global.document.getElementById(config.scriptId)?.parentElement! : global.document.documentElement!)
        .set('backpressure', () => Backpressure.fastest)
        .set('invalidator', () => new Invalidator())
        .set('graph', ({throttle, backpressure, invalidator}: { throttle: ThrottleStrategy, backpressure: BackpressureStrategy, invalidator: Invalidator }) =>
            new BaseGraph(backpressure, throttle, invalidator, global)), global);
}