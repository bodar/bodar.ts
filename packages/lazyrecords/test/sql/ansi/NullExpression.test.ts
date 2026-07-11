import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {statement} from "../../../src/sql/statement/ordinalPlaceholder.ts";
import {sql} from "../../../src/sql/template/Sql.ts";
import {expression} from "../../../src/sql/template/Compound.ts";
import {qualified} from "../../../src/sql/ansi/Qualified.ts";
import {jsonExtract} from "../../../src/sql/sqlite/jsonExtract.ts";
import {isNotNull, isNull} from "../../../src/sql/ansi/NullExpression.ts";

describe('NullExpression', () => {
    it('renders IS NULL / IS NOT NULL', () => {
        assertThat(statement(sql(isNull())), equals({text: 'is null', args: []}));
        assertThat(statement(sql(isNotNull())), equals({text: 'is not null', args: []}));
    });

    it('combines with a json_extract predicand (values() existence filter)', () => {
        assertThat(statement(sql(expression(jsonExtract(qualified('n', 'props'), 'age'), isNotNull()))),
            equals({text: `json_extract("n"."props", '$.age') is not null`, args: []}));
    });
});
