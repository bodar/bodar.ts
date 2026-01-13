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
import {Display} from './api/display.ts';
import {View} from './api/view.ts';
import {Width} from './api/width.ts';
import {input} from './api/input.ts';
import {events} from './api/events.ts';
import {observe} from './api/observe.ts';
import {mutable} from './api/mutable.ts';
import {now} from './api/now.ts';
import {raw} from './api/raw.ts';
import {JSX2DOM, autoKeyEvents} from "@bodar/jsx2dom/JSX2DOM.ts";

export {display, Display} from './api/display.ts';
export {view, View} from './api/view.ts';
export {width, Width} from './api/width.ts';
export {input} from './api/input.ts';
export {events} from './api/events.ts';
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

/** Creates implicit imports lazy map - APIs available without explicit import via graph auto-wiring */
function createImplicitImports(global: typeof globalThis, invalidator: Invalidator) {
    return LazyMap.create()
        .set('invalidator', () => invalidator)
        .set('jsx', () => new JSX2DOM(chain({onEventListener: autoKeyEvents()}, global)))
        .set('observe', () => observe)
        .set('events', () => events)
        .set('input', () => input)
        .set('mutable', () => mutable)
        .set('now', () => now)
        .set('raw', () => raw);
}

/** Creates a runtime with lazy-initialized dependencies */
export function runtime(config: RuntimeConfig = {}, global: typeof globalThis = globalThis): RuntimeExports & typeof globalThis {
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
        .set('Display', () => Display)
        .set('View', () => View)
        .set('Width', () => Width)
        .set('graph', ({throttle, backpressure, invalidator}: { throttle: ThrottleStrategy, backpressure: BackpressureStrategy, invalidator: Invalidator }) =>
            new BaseGraph(backpressure, throttle, invalidator, chain(createImplicitImports(global, invalidator), global))), global) as RuntimeExports & typeof globalThis;
}