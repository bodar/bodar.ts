import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {statement} from "../../../src/sql/statement/ordinalPlaceholder.ts";
import {sql} from "../../../src/sql/template/Sql.ts";
import {text} from "../../../src/sql/template/Text.ts";
import {value} from "../../../src/sql/template/Value.ts";
import {union, unionAll} from "../../../src/sql/ansi/SetOperation.ts";

describe('SetOperation', () => {
    it('joins bodies with UNION ALL, binds in order', () => {
        assertThat(statement(sql(unionAll(
            sql(text('select id from c0 where id = '), value(1)),
            sql(text('select id from c1 where id = '), value(2)),
            sql(text('select id from c2 where id = '), value(3)),
        ))), equals({text: 'select id from c0 where id = ? union all select id from c1 where id = ? union all select id from c2 where id = ?', args: [1, 2, 3]}));
    });

    it('supports UNION', () => {
        assertThat(statement(sql(union(sql(text('select 1')), sql(text('select 2'))))),
            equals({text: 'select 1 union select 2', args: []}));
    });
});
