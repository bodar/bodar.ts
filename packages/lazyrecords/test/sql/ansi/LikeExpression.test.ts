import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {statement} from "../../../src/sql/statement/ordinalPlaceholder.ts";
import {sql} from "../../../src/sql/template/Sql.ts";
import {expression} from "../../../src/sql/template/Compound.ts";
import {qualified} from "../../../src/sql/ansi/Qualified.ts";
import {like, notLike} from "../../../src/sql/ansi/LikeExpression.ts";

describe('LikeExpression', () => {
    it('renders LIKE with a bound pattern', () => {
        assertThat(statement(sql(like('mar%'))), equals({text: 'like ?', args: ['mar%']}));
    });

    it('renders NOT LIKE with a bound ESCAPE char', () => {
        assertThat(statement(sql(notLike('%\\%%', '\\'))), equals({text: 'not like ? escape ?', args: ['%\\%%', '\\']}));
    });

    it('combines with a predicand (TextP.startingWith)', () => {
        assertThat(statement(sql(expression(qualified('n', 'name'), like('mar%', '\\')))),
            equals({text: '"n"."name" like ? escape ?', args: ['mar%', '\\']}));
    });
});
