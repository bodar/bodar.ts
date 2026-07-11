import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {statement} from "../../../src/sql/statement/ordinalPlaceholder.ts";
import {sql} from "../../../src/sql/template/Sql.ts";
import {limit} from "../../../src/sql/sqlite/LimitClause.ts";

describe('LimitClause', () => {
    it('emits a bare LIMIT when no offset is given', () => {
        assertThat(statement(sql(limit(10))), equals({text: 'limit 10', args: []}));
    });

    it('emits LIMIT with OFFSET', () => {
        assertThat(statement(sql(limit(10, 5))), equals({text: 'limit 10 offset 5', args: []}));
    });

    it('supports the -1 no-limit sentinel with an offset', () => {
        assertThat(statement(sql(limit(-1, 5))), equals({text: 'limit -1 offset 5', args: []}));
    });

    it('emits OFFSET 0 explicitly when requested', () => {
        assertThat(statement(sql(limit(10, 0))), equals({text: 'limit 10 offset 0', args: []}));
    });
});
