import {describe, test} from "bun:test";
import {Dataflow} from "../src/Dataflow.ts";
import {toPromiseArray} from "@bodar/totallylazy/collections/Array.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";

describe("Dataflow", () => {
    test("if the function has a name use that as the key", async () => {
        const dataflow = new Dataflow();
        const {constant} = dataflow.define(function constant() {
            return 1;
        });
        assertThat(await toPromiseArray(constant), equals([1]));
    });

    test("otherwise calculate the hash of the function source", async () => {
        const dataflow = new Dataflow();
        const {rmbt6f} = dataflow.define(function () {
            return 1;
        });
        assertThat(await toPromiseArray(rmbt6f), equals([1]));
    });

    test("can provide a key explicitly", async () => {
        const dataflow = new Dataflow();
        const {fun} = dataflow.define('fun', function () {
            return 1;
        });
        assertThat(await toPromiseArray(fun), equals([1]));
    });

    test("can create a node from a function that returns a value, if it has no inputs it only ever have 1 result", async () => {
        const dataflow = new Dataflow();
        const {node} = dataflow.define('node', () => 1);
        assertThat(await toPromiseArray(node), equals([1]));
    });

    test("Can iterate multiple times and it still returns the same state", async () => {
        const dataflow = new Dataflow();
        const {node} = dataflow.define('node', () => 1);
        assertThat(await toPromiseArray(node), equals([1]));
        assertThat(await toPromiseArray(node), equals([1]));
    });

    test("nodes can depend on other nodes", async () => {
        const dataflow = new Dataflow();
        dataflow.define("nodeA", () => 1);
        const {nodeB} = dataflow.define('nodeB', (nodeA: number) => nodeA * 2);
        assertThat(await toPromiseArray(nodeB), equals([2]));
    });

    test("functions are only called once unless their input change", async () => {
        const dataflow = new Dataflow();
        let count = 0;
        const {node} = dataflow.define(function node() {
            count++;
            return 1;
        });
        assertThat(count, is(0));
        assertThat(await toPromiseArray(node), equals([1]));
        assertThat(count, is(1));
        assertThat(await toPromiseArray(node), equals([1]));
        assertThat(count, is(1));
    });

    test("if a function returns an generator then the node will yield the values not the generator", async () => {
        const dataflow = new Dataflow();
        const {test} = dataflow.define(function* test() {
            yield* [1, 2, 3];
        });
        assertThat(await toPromiseArray(test), equals([1, 2, 3]));
    });

    test("can compose generators with constants", async () => {
        const dataflow = new Dataflow();
        dataflow.define('constant', () => 10);
        dataflow.define(function* generator() {
            yield* [1, 2, 3];
        });
        const {combined} = dataflow.define(function combined(constant: number, generator: number) {
            return constant * generator
        });
        assertThat(await toPromiseArray(combined), equals([10, 20, 30]));
    });

    test("if a function returns multiple things then it will create multiple nodes", async () => {
        const dataflow = new Dataflow();
        const {fun, a, b} = dataflow.define('fun', () => ({a: 1, b: 2}));
        assertThat(await toPromiseArray(fun), equals([{a: 1, b: 2}]));
        assertThat(await toPromiseArray(a), equals([1]));
        assertThat(await toPromiseArray(b), equals([2]));
    });
})

