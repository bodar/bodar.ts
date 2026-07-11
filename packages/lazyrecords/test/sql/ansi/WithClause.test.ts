import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {statement} from "../../../src/sql/statement/ordinalPlaceholder.ts";
import {sql} from "../../../src/sql/template/Sql.ts";
import {text} from "../../../src/sql/template/Text.ts";
import {cte} from "../../../src/sql/ansi/CommonTableExpression.ts";
import {withClause} from "../../../src/sql/ansi/WithClause.ts";

describe('WithClause', () => {
    it('renders a WITH prefix over several CTEs', () => {
        assertThat(statement(sql(withClause([
            cte('c0', sql(text('select id from nodes'))),
            cte('c1', sql(text('select id from c0'))),
        ]))), equals({text: 'with "c0" as (select id from nodes), "c1" as (select id from c0)', args: []}));
    });

    it('appends the statement body when given', () => {
        assertThat(statement(sql(withClause(
            [cte('c0', sql(text('select id from nodes')))],
            sql(text('select v from c0'))))),
            equals({text: 'with "c0" as (select id from nodes) select v from c0', args: []}));
    });
});
