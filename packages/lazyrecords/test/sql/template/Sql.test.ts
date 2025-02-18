import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {sql, SQL} from "@bodar/lazyrecords/sql/template/Sql.ts";
import {text} from "@bodar/lazyrecords/sql/template/Text.ts";
import {value} from "@bodar/lazyrecords/sql/template/Value.ts";
import {spread} from "@bodar/lazyrecords/sql/template/Compound.ts";

describe('SQL', () => {
    it('text', () => {
        assertThat(SQL``, equals(sql()));
        assertThat(SQL`select 1;`, equals(sql(text('select 1;'))));
    });

    it('text and value', () => {
        assertThat(SQL`${1}`, equals(sql(value(1))));
        const name = 'Dan';
        assertThat(SQL`select * from user where name = ${name};`, equals(sql(
            text('select * from user where name = '),
            value(name),
            text(';')
        )));
    });

    it('does not introduce any spaces', () => {
        assertThat(SQL`Hello${1}SQL${2}`, equals(sql(
            text('Hello'),
            value(1),
            text('SQL'),
            value(2),
        )));
    });

    it('handles null', () => {
        assertThat(SQL`SELECT * FROM users WHERE name = ${null}`, equals(sql(
            text('SELECT * FROM users WHERE name = '),
            value(null),
        )));
    });

    it('maps undefined to null', () => {
        assertThat(SQL`SELECT * FROM users WHERE name = ${undefined}`, equals(sql(
            text('SELECT * FROM users WHERE name = '),
            value(null),
        )));
    });

    it('can nest SQL expressions', () => {
        assertThat(SQL`SELECT * ${SQL`FROM users WHERE name = ${undefined}`}`, equals(sql(
            text('SELECT * '),
            sql(text('FROM users WHERE name = '),
                value(null)),
        )));
    });

    it('can spread arrays', () => {
        assertThat(SQL`SELECT * FROM users WHERE id IN (${spread([1, 2, 3])})`, equals(sql(
            text('SELECT * FROM users WHERE id IN ('),
            sql(value(1), text(', '), value(2), text(', '), value(3)),
            text(')'),
        )));
    });
});
