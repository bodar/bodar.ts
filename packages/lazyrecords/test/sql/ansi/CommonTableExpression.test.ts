import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {statement} from "../../../src/sql/statement/ordinalPlaceholder.ts";
import {sql} from "../../../src/sql/template/Sql.ts";
import {text} from "../../../src/sql/template/Text.ts";
import {value} from "../../../src/sql/template/Value.ts";
import {cte} from "../../../src/sql/ansi/CommonTableExpression.ts";

describe('CommonTableExpression', () => {
    it('renders name AS (body)', () => {
        assertThat(statement(sql(cte('c0', sql(text('select id from nodes'))))),
            equals({text: '"c0" as (select id from nodes)', args: []}));
    });

    it('renders an explicit column list and carries body binds', () => {
        assertThat(statement(sql(cte('c0', sql(text('values ('), value(1), text(')')), ['v']))),
            equals({text: '"c0"("v") as (values (?))', args: [1]}));
    });
});
