import {describe, expect, test} from "bun:test";
import {constructor, instance, LazyMap} from "@bodar/yadic/LazyMap.ts";
import type {Dependency} from "@bodar/yadic/types.ts";

describe("LazyMap", () => {
    test("can set using a function", () => {
        const map = LazyMap.create()
            .set('should', () => 'work');
        expect(map.should).toEqual('work');
    });

    test("is lazy and function is only called once", () => {
        let count = 0
        const map = LazyMap.create()
            .set('should', () => ++count);
        expect(map.should).toEqual(1);
        expect(map.should).toEqual(1);
    });

    test("can set with an instance", () => {
        const map = LazyMap.create()
            .set('should', instance('work'));
        expect(map.should).toEqual('work');
    });

    test("can set with a constructor", () => {
        class Foo {
        }

        const map = LazyMap.create()
            .set('should', constructor(Foo));
        expect(map.should).toBeInstanceOf(Foo);
    });

    test("can set with a constructor that depends on another type", () => {
        class Foo {
            constructor(deps: Dependency<'aDependency', number>,
                        public aDependency = deps.aDependency ) {
            }
        }

        const map = LazyMap.create()
            .set('aDependency', instance(1))
            .set('should', constructor(Foo));
        expect(map.should).toBeInstanceOf(Foo);
        expect(map.should.aDependency).toEqual(1);
    });

    test("can decorate a dependency", () => {
        class A {
        }

        class B {
            constructor(deps: Dependency<'object', A>, public a = deps.object) {
            }
        }

        const map = LazyMap.create()
            .set('object', constructor(A))
            .decorate('object', constructor(B));
        expect(map.object).toBeInstanceOf(B);
        expect(map.object.a).toBeInstanceOf(A);
    });

    test("can create a map from another map", () => {
        const parent = LazyMap.create()
            .set('a', instance(1))

        const child = LazyMap.create(parent)
            .set('b', deps => deps.a + 1);

        expect(parent.a).toEqual(1);
        expect(child.b).toEqual(2);
    });

    test("when the dependency is in the parent map, it should be created only once at the parent", () => {
        let count = 0;
        const parent = LazyMap.create()
            .set('a', () => ++count);

        const child = LazyMap.create(parent)
            .set('b', deps => deps.a + 1);

        expect(child.b).toEqual(2);
        expect(parent.a).toEqual(1);
    });

    test("can override a dependency as long as it has not been used", () => {
        const map = LazyMap.create()
            .set('a', instance(1))
            .set('b', deps => deps.a + 1)
            .set('a', instance(2));

        expect(map.b).toEqual(3);
        expect(map.a).toEqual(2);
    });

    test("once a dependency has been used it can't be changed", () => {
        const map = LazyMap.create()
            .set('a', instance(1));
        expect(map.a).toEqual(1);

        try {
            map.set('a', instance(2));
            expect('').toEqual('should not get here');
        } catch (e) {
            expect(e).toBeInstanceOf(TypeError);
            expect(map.a).toEqual(1);
        }
    });
})

