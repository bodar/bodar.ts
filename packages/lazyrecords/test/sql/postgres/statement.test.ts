import {describe, it} from "bun:test";
import {statement} from "@bodar/lazyrecords/sql/statement/numberedPlaceholder.ts";
import {id} from "@bodar/lazyrecords/sql/template/Identifier.ts";
import {SQL} from "@bodar/lazyrecords/sql/template/Sql.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {ids, values} from "@bodar/lazyrecords/sql/template/Compound.ts";

describe('statement', () => {
    it('supports correctly escaping identifiers', () => {
        const dynamic = "user's";
        assertThat(statement(SQL`SELECT * FROM ${id(dynamic)} WHERE name = ${'dan'}`), equals({
            text: 'SELECT * FROM "user\'s" WHERE name = $1',
            args: ['dan']
        }));
    });

    it('automatically handles arrays of identifiers', () => {
        assertThat(statement(SQL`${ids(['first_name', 'last_name'])}`), equals({
            text: `"first_name", "last_name"`,
            args: []
        }));
    });

    it('automatically handles arrays and ids', () => {
        const template = SQL`INSERT INTO users (${ids(['first_name', 'last_name'])}) VALUES (${values(['Dan', 'Bodart'])})`;
        assertThat(statement(template), equals({
            text: `INSERT INTO users ("first_name", "last_name") VALUES ($1, $2)`,
            args: ['Dan', 'Bodart']
        }));
    });
});