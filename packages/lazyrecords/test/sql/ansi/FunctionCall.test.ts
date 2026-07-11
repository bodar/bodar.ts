import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {statement} from "../../../src/sql/statement/ordinalPlaceholder.ts";
import {sql} from "../../../src/sql/template/Sql.ts";
import {qualified} from "../../../src/sql/ansi/Qualified.ts";
import {count, functionCall} from "../../../src/sql/ansi/FunctionCall.ts";

describe('FunctionCall', () => {
    it('renders count(*)', () => {
        assertThat(statement(sql(count())), equals({text: 'count(*)', args: []}));
    });

    it('renders count over a column', () => {
        assertThat(statement(sql(count(qualified('n', 'id')))), equals({text: 'count("n"."id")', args: []}));
    });

    it('renders an arbitrary function with multiple args', () => {
        assertThat(statement(sql(functionCall('coalesce', qualified('n', 'a'), qualified('n', 'b')))),
            equals({text: 'coalesce("n"."a", "n"."b")', args: []}));
    });

    it('renders a zero-arg function', () => {
        assertThat(statement(sql(functionCall('changes'))), equals({text: 'changes()', args: []}));
    });
});
