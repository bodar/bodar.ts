import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {statement} from "../../../src/sql/statement/ordinalPlaceholder.ts";
import {sql} from "../../../src/sql/template/Sql.ts";
import {text} from "../../../src/sql/template/Text.ts";
import {value} from "../../../src/sql/template/Value.ts";
import {exists, notExists} from "../../../src/sql/ansi/ExistsExpression.ts";

describe('ExistsExpression', () => {
    it('wraps a correlated subquery body and carries its binds', () => {
        assertThat(statement(sql(exists(sql(text('select 1 from edges e where e.src=n.id and e.label='), value(3))))),
            equals({text: 'exists(select 1 from edges e where e.src=n.id and e.label=?)', args: [3]}));
    });

    it('renders NOT EXISTS', () => {
        assertThat(statement(sql(notExists(sql(text('select 1 from edges e where e.tgt=n.id'))))),
            equals({text: 'not exists(select 1 from edges e where e.tgt=n.id)', args: []}));
    });
});
