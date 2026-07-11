import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {statement} from "../../../src/sql/statement/ordinalPlaceholder.ts";
import {sql} from "../../../src/sql/template/Sql.ts";
import {text} from "../../../src/sql/template/Text.ts";
import {cte} from "../../../src/sql/ansi/CommonTableExpression.ts";
import {withRecursive} from "../../../src/sql/ansi/WithClause.ts";

describe('WithClause (recursive)', () => {
    it('prefixes WITH RECURSIVE', () => {
        assertThat(statement(sql(withRecursive(
            [cte('walk', sql(text('select id, 0 as depth from c0')))],
            sql(text('select id from walk'))))),
            equals({text: 'with recursive "walk" as (select id, 0 as depth from c0) select id from walk', args: []}));
    });
});
