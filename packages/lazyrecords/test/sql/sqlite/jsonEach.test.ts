import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {statement} from "../../../src/sql/statement/ordinalPlaceholder.ts";
import {sql} from "../../../src/sql/template/Sql.ts";
import {qualified} from "../../../src/sql/ansi/Qualified.ts";
import {jsonEach} from "../../../src/sql/sqlite/jsonEach.ts";

describe('jsonEach', () => {
    it('references a JSON column as a table-valued function', () => {
        assertThat(statement(sql(jsonEach(qualified('n', 'props')))), equals({text: `json_each("n"."props")`, args: []}));
    });
});
