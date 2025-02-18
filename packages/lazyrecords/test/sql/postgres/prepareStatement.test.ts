import {describe, it} from "bun:test";
import {prepareStatement} from "@bodar/lazyrecords/sql/postgres/prepareStatement.ts";
import {SQL} from "@bodar/lazyrecords/sql/template/Sql.ts";
import {id} from "@bodar/lazyrecords/sql/template/Identifier.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";

describe('prepareStatement', () => {
    it('can automatically generate a name from the SQL ("An operator name is a sequence of up to NAMEDATALEN-1 (63 by default)")', async () => {
        const dynamic = "user's";
        const statement = await prepareStatement(SQL`SELECT * FROM ${id(dynamic)} WHERE name = ${'dan'}`);
        assertThat(statement, equals({
            name: '3b2c9eed3db8e538bcee7c0d480856b984c0e16af2ac79d4a0d0e7094a6ec54',
            text: 'SELECT * FROM "user\'s" WHERE name = $1',
            args: ['dan']
        }));
        assertThat(statement.name?.length, equals(63));
    });

    it('can provide name from the SQL', async () => {
        const dynamic = "user's";
        assertThat(await prepareStatement(SQL`SELECT * FROM ${id(dynamic)} WHERE name = ${'dan'}`, 'foo'), equals({
            name: 'foo',
            text: 'SELECT * FROM "user\'s" WHERE name = $1',
            args: ['dan']
        }));
    });
});