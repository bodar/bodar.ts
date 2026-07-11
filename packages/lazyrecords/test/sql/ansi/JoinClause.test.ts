import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {statement} from "../../../src/sql/statement/ordinalPlaceholder.ts";
import {sql} from "../../../src/sql/template/Sql.ts";
import {text} from "../../../src/sql/template/Text.ts";
import {expression} from "../../../src/sql/template/Compound.ts";
import {table} from "../../../src/sql/ansi/Table.ts";
import {qualified} from "../../../src/sql/ansi/Qualified.ts";
import {join} from "../../../src/sql/ansi/JoinClause.ts";

describe('JoinClause', () => {
    it('renders an inner JOIN with an aliased table and ON condition', () => {
        assertThat(statement(sql(join(
            table('nodes').as('n'),
            expression(qualified('n', 'id'), text('='), qualified('p', 'id'))))),
            equals({text: 'join "nodes" as "n" on "n"."id" = "p"."id"', args: []}));
    });
});
