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

    // --- parent-child: a child must expose inherited keys via DIRECT access, not only
    //     through a factory's `deps`. `create<P>(parent): LazyMap & P` promises `child.a`
    //     resolves to the parent's value; today it returns undefined. ---
    describe("parent inheritance is directly readable", () => {
        test("an inherited key resolves via direct access on the child", () => {
            const parent = LazyMap.create()
                .set('a', instance(1))
                .set('b', instance(2));
            const child = LazyMap.create(parent)
                .set('c', instance(3));

            expect(child.a).toEqual(1);   // inherited, direct read
            expect(child.b).toEqual(2);   // inherited, direct read
            expect(child.c).toEqual(3);   // own
        });

        test("a key set on the child AFTER create() is still readable", () => {
            const parent = LazyMap.create().set('a', instance(1));
            const child = LazyMap.create(parent)
                .set('b', deps => deps.a + 1);   // factory over an inherited key

            expect(child.b).toEqual(2);   // own key, set after create()
            expect(child.a).toEqual(1);   // inherited, direct read
        });

        test("a child can shadow (override) an inherited key before it is used", () => {
            const parent = LazyMap.create()
                .set('a', instance(1))
                .set('b', instance(2));
            const child = LazyMap.create(parent)
                .set('a', instance(99));   // override the inherited 'a'

            expect(child.a).toEqual(99);  // child's own value wins
            expect(child.b).toEqual(2);   // still inherited
            expect(parent.a).toEqual(1);  // parent untouched
        });

        test("an inherited lazy dependency is realised once and shared across children", () => {
            let count = 0;
            const parent = LazyMap.create()
                .set('shared', () => ({ id: ++count }));

            const child1 = LazyMap.create(parent).set('x', instance('x'));
            const child2 = LazyMap.create(parent).set('y', instance('y'));

            const fromChild1 = child1.shared;   // direct read of an inherited lazy dep
            const fromChild2 = child2.shared;

            expect(count).toEqual(1);                 // realised exactly once (on the parent)
            expect(fromChild1).toBe(fromChild2);      // same singleton instance across children
            expect(parent.shared).toBe(fromChild1);   // and it IS the parent's instance
        });

        test("grandparent keys resolve through two levels of direct access", () => {
            const grandparent = LazyMap.create().set('a', instance(1));
            const parent = LazyMap.create(grandparent).set('b', instance(2));
            const child = LazyMap.create(parent).set('c', instance(3));

            expect(child.a).toEqual(1);   // from grandparent
            expect(child.b).toEqual(2);   // from parent
            expect(child.c).toEqual(3);   // own
        });
    });
})

