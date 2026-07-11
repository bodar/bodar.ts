import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {statement} from "../../../src/sql/statement/ordinalPlaceholder.ts";
import {sql} from "../../../src/sql/template/Sql.ts";
import {text} from "../../../src/sql/template/Text.ts";
import {qualified} from "../../../src/sql/ansi/Qualified.ts";
import {jsonExtract} from "../../../src/sql/sqlite/jsonExtract.ts";
import {groupBy} from "../../../src/sql/ansi/GroupByClause.ts";

describe('GroupByClause', () => {
    it('renders a single grouping key', () => {
        assertThat(statement(sql(groupBy([text('gk')]))), equals({text: 'group by gk', args: []}));
    });

    it('renders multiple keys incl. a json_extract', () => {
        assertThat(statement(sql(groupBy([jsonExtract(qualified('n', 'props'), 'age'), qualified('n', 'label')]))),
            equals({text: `group by json_extract("n"."props", '$.age'), "n"."label"`, args: []}));
    });
});
