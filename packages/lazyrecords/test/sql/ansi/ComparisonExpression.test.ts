import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {statement} from "../../../src/sql/statement/ordinalPlaceholder.ts";
import {sql} from "../../../src/sql/template/Sql.ts";
import {expression} from "../../../src/sql/template/Compound.ts";
import {qualified} from "../../../src/sql/ansi/Qualified.ts";
import {comparison} from "../../../src/sql/ansi/ComparisonExpression.ts";

describe('ComparisonExpression', () => {
    it('renders the predicate tail with a bound value', () => {
        assertThat(statement(sql(comparison('>=', 42))), equals({text: '>= ?', args: [42]}));
    });

    it('combines with a predicand in a space-separated compound', () => {
        assertThat(statement(sql(expression(qualified('n', 'age'), comparison('<', 100)))),
            equals({text: '"n"."age" < ?', args: [100]}));
    });

    it('supports inequality', () => {
        assertThat(statement(sql(comparison('!=', 'x'))), equals({text: '!= ?', args: ['x']}));
    });
});
