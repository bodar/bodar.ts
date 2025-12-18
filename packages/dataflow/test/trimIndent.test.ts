import {describe, test} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {trimIndent} from "../src/html/ScriptTransformer.ts";

describe("trimIndent", () => {
    test("returns empty string for empty input", () => {
        assertThat(trimIndent(""), is(""));
    });

    test("returns empty string for whitespace-only input", () => {
        assertThat(trimIndent("   \n   \n   "), is(""));
    });

    test("removes leading indent based on first non-empty line", () => {
        const input = `
            const x = 1;
            const y = 2;`;
        assertThat(trimIndent(input), is("const x = 1;\nconst y = 2;"));
    });

    test("preserves relative indentation", () => {
        const input = `
            function foo() {
                return 1;
            }`;
        assertThat(trimIndent(input), is("function foo() {\n    return 1;\n}"));
    });

    test("handles mixed indentation levels", () => {
        const input = `
            if (true) {
                if (false) {
                    return 1;
                }
            }`;
        assertThat(trimIndent(input), is("if (true) {\n    if (false) {\n        return 1;\n    }\n}"));
    });

    test("handles lines with less indentation than baseline", () => {
        const input = `
            const x = 1;
const y = 2;`;
        assertThat(trimIndent(input), is("const x = 1;\nconst y = 2;"));
    });

    test("removes trailing whitespace from the end", () => {
        const input = `
            const x = 1;
            const y = 2;   `;
        assertThat(trimIndent(input), is("const x = 1;\nconst y = 2;"));
    });

    test("trims trailing whitespace from each line", () => {
        const input = "\n            const x = 1;   \n            const y = 2;  ";
        assertThat(trimIndent(input), is("const x = 1;\nconst y = 2;"));
    });

    test("preserves whitespace in the middle of a line", () => {
        const input = "\n            const x   =   1;";
        assertThat(trimIndent(input), is("const x   =   1;"));
    });

    test("handles text with no leading newline", () => {
        const input = "const x = 1;\nconst y = 2;";
        assertThat(trimIndent(input), is("const x = 1;\nconst y = 2;"));
    });

    test("handles single line input", () => {
        assertThat(trimIndent("const x = 1;"), is("const x = 1;"));
    });

    test("handles single line with leading whitespace", () => {
        assertThat(trimIndent("    const x = 1;"), is("const x = 1;"));
    });

    test("preserves empty lines in the middle", () => {
        const input = `
            const x = 1;

            const y = 2;`;
        assertThat(trimIndent(input), is("const x = 1;\n\nconst y = 2;"));
    });

    test("handles tabs as indentation", () => {
        const input = "\n\t\tconst x = 1;\n\t\t\tconst y = 2;";
        assertThat(trimIndent(input), is("const x = 1;\n\tconst y = 2;"));
    });
});
