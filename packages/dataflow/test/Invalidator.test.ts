import {describe, expect, test} from "bun:test";
import {Invalidator} from "../src/Invalidator.ts";

describe("Invalidator", () => {
    test("default rules handle null and undefined without error", () => {
        const invalidator = new Invalidator();
        expect(() => invalidator.invalidate(null)).not.toThrow();
        expect(() => invalidator.invalidate(undefined)).not.toThrow();
    });

    test("default rules abort AbortController", () => {
        const invalidator = new Invalidator();
        const controller = new AbortController();
        expect(controller.signal.aborted).toBe(false);
        invalidator.invalidate(controller);
        expect(controller.signal.aborted).toBe(true);
    });

    test("default rules call Symbol.dispose", () => {
        const invalidator = new Invalidator();
        let disposed = false;
        const disposable = {
            [Symbol.dispose]() {
                disposed = true;
            }
        };
        invalidator.invalidate(disposable);
        expect(disposed).toBe(true);
    });

    test("default rules call Symbol.asyncDispose", () => {
        const invalidator = new Invalidator();
        let disposed = false;
        const disposable = {
            [Symbol.asyncDispose]() {
                disposed = true;
                return Promise.resolve();
            }
        };
        invalidator.invalidate(disposable);
        expect(disposed).toBe(true);
    });

    test("custom rules can be added", () => {
        const invalidator = new Invalidator();
        const disconnected: string[] = [];
        invalidator.add(
            value => typeof value.disconnect === 'function',
            value => {
                disconnected.push(value.name);
                value.disconnect();
            }
        );

        const node = {name: 'oscillator', disconnect() {}};
        invalidator.invalidate(node);
        expect(disconnected).toEqual(['oscillator']);
    });

    test("custom rules are checked after default rules", () => {
        const invalidator = new Invalidator();
        const calls: string[] = [];

        // Add a custom rule that would match AbortController
        invalidator.add(
            value => value instanceof AbortController,
            () => calls.push('custom')
        );

        const controller = new AbortController();
        invalidator.invalidate(controller);

        // Default AbortController rule should have matched first
        expect(controller.signal.aborted).toBe(true);
        expect(calls).toEqual([]); // Custom rule should not have been called
    });

    test("stops on first matching rule", () => {
        const invalidator = new Invalidator();
        const calls: string[] = [];

        invalidator.add(
            value => value.type === 'test',
            () => calls.push('first')
        );
        invalidator.add(
            value => value.type === 'test',
            () => calls.push('second')
        );

        invalidator.invalidate({type: 'test'});
        expect(calls).toEqual(['first']);
    });

    test("add returns this for chaining", () => {
        const invalidator = new Invalidator();
        const result = invalidator
            .add(() => false, () => {})
            .add(() => false, () => {});
        expect(result).toBe(invalidator);
    });

    test("catches and logs errors from handlers", () => {
        const invalidator = new Invalidator();
        const errors: any[] = [];
        const originalError = console.error;
        console.error = (...args) => errors.push(args);

        invalidator.add(
            () => true,
            () => { throw new Error('test error'); }
        );

        expect(() => invalidator.invalidate({})).not.toThrow();
        expect(errors.length).toBe(1);
        expect(errors[0][0]).toBe('Error during invalidate:');

        console.error = originalError;
    });

    test("can be constructed with custom initial rules", () => {
        const calls: string[] = [];
        const invalidator = new Invalidator([
            {predicate: () => true, handler: () => calls.push('custom')}
        ]);

        invalidator.invalidate({});
        expect(calls).toEqual(['custom']);
    });
});
