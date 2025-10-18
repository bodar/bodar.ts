import type {Predicate} from "../predicates/Predicate.ts";
import {is} from "../predicates/IsPredicate.ts";
import { toString } from "../functions/toString.ts";

export function assertThat(actual: unknown, predicate: Predicate<any>) {
    if (!predicate(actual)) {
        throw new Error(`assertThat(${toString(actual)}, ${predicate});`);
    }
}

export function assertTrue(value: boolean): asserts value is true {
    assertThat(value, is(true));
}

export function assertFalse(value: boolean): asserts value is false {
    assertThat(value, is(false));
}


// macros/inspect.ts
export function inspect(callExpression: any) {
    console.log("=== INSPECT MACRO ===");
    console.log("Argument value:", callExpression);

    // Try to get stack trace
    console.log("\n--- Stack Trace ---");
    const error = new Error();
    console.log(error.stack);

    // Try import.meta
    console.log("\n--- Import Meta ---");
    console.log("import.meta:", import.meta);


    return callExpression;
}
