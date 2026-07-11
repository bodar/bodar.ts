import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {statement} from "../../../src/sql/statement/ordinalPlaceholder.ts";
import {sql} from "../../../src/sql/template/Sql.ts";
import {text} from "../../../src/sql/template/Text.ts";
import {qualified} from "../../../src/sql/ansi/Qualified.ts";
import {jsonExtract} from "../../../src/sql/sqlite/jsonExtract.ts";

describe('jsonExtract', () => {
    it('splices a safe identifier key as a raw literal path (index-eligible)', () => {
        const node = jsonExtract(qualified('n', 'props'), 'age');
        assertThat(statement(sql(node)), equals({text: `json_extract("n"."props", '$.age')`, args: []}));
        assertThat(node.indexKey, equals('age'));
    });

    it('binds an exotic key and reports no index key', () => {
        const node = jsonExtract(qualified('n', 'props'), 'first name');
        assertThat(statement(sql(node)), equals({text: `json_extract("n"."props", '$.' || ?)`, args: ['first name']}));
        assertThat(node.indexKey, equals(null));
    });

    it('emits its bound key once per occurrence when reused (no manual splice)', () => {
        const node = jsonExtract(qualified('n', 'props'), 'weird.key');
        assertThat(statement(sql(node, text(' >= '), node)), equals({
            text: `json_extract("n"."props", '$.' || ?) >= json_extract("n"."props", '$.' || ?)`,
            args: ['weird.key', 'weird.key']
        }));
    });
});
