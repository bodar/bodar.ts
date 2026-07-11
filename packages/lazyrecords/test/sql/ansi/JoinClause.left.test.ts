import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {statement} from "../../../src/sql/statement/ordinalPlaceholder.ts";
import {sql} from "../../../src/sql/template/Sql.ts";
import {text} from "../../../src/sql/template/Text.ts";
import {expression} from "../../../src/sql/template/Compound.ts";
import {table} from "../../../src/sql/ansi/Table.ts";
import {qualified} from "../../../src/sql/ansi/Qualified.ts";
import {leftJoin} from "../../../src/sql/ansi/JoinClause.ts";

describe('JoinClause (left)', () => {
    it('renders a LEFT JOIN', () => {
        assertThat(statement(sql(leftJoin(
            table('edges').as('e'),
            expression(qualified('e', 'src'), text('='), qualified('p', 'id'))))),
            equals({text: 'left join "edges" as "e" on "e"."src" = "p"."id"', args: []}));
    });
});
