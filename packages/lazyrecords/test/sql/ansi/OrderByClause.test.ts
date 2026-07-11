import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {statement} from "../../../src/sql/statement/ordinalPlaceholder.ts";
import {sql} from "../../../src/sql/template/Sql.ts";
import {qualified} from "../../../src/sql/ansi/Qualified.ts";
import {orderBy} from "../../../src/sql/ansi/OrderByClause.ts";
import {jsonExtract} from "../../../src/sql/sqlite/jsonExtract.ts";
import {random} from "../../../src/sql/sqlite/random.ts";

describe('OrderByClause', () => {
    it('renders multiple keys with directions', () => {
        assertThat(statement(sql(orderBy([
            {expression: jsonExtract(qualified('n', 'props'), 'age'), direction: 'desc'},
            {expression: qualified('n', 'id'), direction: 'asc'},
        ]))), equals({text: `order by json_extract("n"."props", '$.age') desc, "n"."id" asc`, args: []}));
    });

    it('omits direction when not given (e.g. random shuffle)', () => {
        assertThat(statement(sql(orderBy([{expression: random()}]))),
            equals({text: 'order by random()', args: []}));
    });
});
