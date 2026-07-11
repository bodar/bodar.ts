import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {statement} from "../../../src/sql/statement/ordinalPlaceholder.ts";
import {sql} from "../../../src/sql/template/Sql.ts";
import {valuesClause} from "../../../src/sql/ansi/ValuesClause.ts";

describe('ValuesClause', () => {
    it('renders single-column rows with binds in order', () => {
        assertThat(statement(sql(valuesClause([[1], [2], [3]]))),
            equals({text: 'values (?), (?), (?)', args: [1, 2, 3]}));
    });

    it('renders multi-column rows', () => {
        assertThat(statement(sql(valuesClause([['a', 1], ['b', 2]]))),
            equals({text: 'values (?, ?), (?, ?)', args: ['a', 1, 'b', 2]}));
    });
});
