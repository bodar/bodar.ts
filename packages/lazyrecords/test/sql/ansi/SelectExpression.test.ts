import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {select} from "@bodar/lazyrecords/sql/ansi/SelectExpression.ts";
import {distinct} from "@bodar/lazyrecords/sql/ansi/SetQuantifier.ts";
import {sql} from "@bodar/lazyrecords/sql/template/Sql.ts";
import {column} from "@bodar/lazyrecords/sql/ansi/Column.ts";
import {from} from "@bodar/lazyrecords/sql/ansi/FromClause.ts";
import {table} from "@bodar/lazyrecords/sql/ansi/Table.ts";
import {where} from "@bodar/lazyrecords/sql/ansi/WhereClause.ts";
import {qualified} from "@bodar/lazyrecords/sql/ansi/Qualified.ts";
import {is} from "@bodar/lazyrecords/sql/ansi/IsExpression.ts";

describe('SelectExpression', () => {
    it('can write in normal SQL order', () => {
        assertThat(sql(
            select(distinct, [column('name').as('n')],
                from(table('person').as('p')),
                where(column('age'), is(42))
            )).toString(), equals('select distinct "name" as "n" from "person" as "p" where "age" = 42'));
    });

    it('can select a single column', () => {
        assertThat(sql(
            select(distinct, column('name'),
                from(table('person'))
            )).toString(), equals('select distinct "name" from "person"'));
    });

    it('can use fully qualified names', () => {
        assertThat(sql(
            select(distinct, column(qualified('schema', 'name')),
                from(table('person'))
            )).toString(), equals('select distinct "schema"."name" from "person"'));
    });

    it('can add additional \'and\' clauses', () => {
        assertThat(sql(
            select(distinct, [column('name').as('n')],
                from(table('person').as('p')),
                where(column('age'), is(42))
                    .and(column('weight'), is(100))
            )).toString(), equals('select distinct "name" as "n" from "person" as "p" where ("age" = 42 and "weight" = 100)'));
    });

    it('can add additional \'or\' clauses', () => {
        assertThat(sql(
            select(distinct, [column('name').as('n')],
                from(table('person').as('p')),
                where(column('age'), is(42))
                    .or(column('weight'), is(100))
            )).toString(), equals('select distinct "name" as "n" from "person" as "p" where ("age" = 42 or "weight" = 100)'));
    });
});