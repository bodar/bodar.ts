export interface ThrottleStrategy {
    (): Promise<any>
}

export class Throttle {
    static refreshRate(global: any = globalThis): ThrottleStrategy {
        return () => new Promise(resolve => global.requestAnimationFrame(resolve));
    }

    static eventLoop(global: any = globalThis): ThrottleStrategy {
        return () => new Promise(resolve => global.setImmediate(resolve));
    }

    static clamped(global: any = globalThis): ThrottleStrategy {
        return this.fixedThrottle(global, 0);
    }

    static fixedThrottle(ms: number, global: any = globalThis): ThrottleStrategy {
        return () => new Promise(resolve => global.setTimeout(resolve, ms));
    }

    static microTasks(): ThrottleStrategy {
        return () => Promise.resolve();
    }

    static auto(global: any = globalThis): ThrottleStrategy {
        if (global.requestAnimationFrame) return this.refreshRate(global);
        if (global.setImmediate) return this.eventLoop(global);
        if (global.setTimeout) return this.clamped(global);
        return this.microTasks();
    }
}

