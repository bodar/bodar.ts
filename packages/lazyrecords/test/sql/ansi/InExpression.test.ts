import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {statement} from "../../../src/sql/statement/ordinalPlaceholder.ts";
import {sql} from "../../../src/sql/template/Sql.ts";
import {expression} from "../../../src/sql/template/Compound.ts";
import {qualified} from "../../../src/sql/ansi/Qualified.ts";
import {inExpression, notIn} from "../../../src/sql/ansi/InExpression.ts";

describe('InExpression', () => {
    it('renders IN over a list of bound values', () => {
        assertThat(statement(sql(inExpression([1, 2, 3]))), equals({text: 'in (?, ?, ?)', args: [1, 2, 3]}));
    });

    it('renders NOT IN', () => {
        assertThat(statement(sql(notIn(['a', 'b']))), equals({text: 'not in (?, ?)', args: ['a', 'b']}));
    });

    it('combines with a predicand', () => {
        assertThat(statement(sql(expression(qualified('n', 'id'), inExpression([7])))),
            equals({text: '"n"."id" in (?)', args: [7]}));
    });

    it('renders an empty list as a no-match (null) instead of invalid IN ()', () => {
        assertThat(statement(sql(inExpression([]))), equals({text: 'in (null)', args: []}));
        assertThat(statement(sql(notIn([]))), equals({text: 'not in (null)', args: []}));
    });
});
