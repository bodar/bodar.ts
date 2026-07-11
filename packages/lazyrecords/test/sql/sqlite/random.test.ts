import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {statement} from "../../../src/sql/statement/ordinalPlaceholder.ts";
import {sql} from "../../../src/sql/template/Sql.ts";
import {random} from "../../../src/sql/sqlite/random.ts";

describe('random', () => {
    it('emits a random() function call', () => {
        assertThat(statement(sql(random())), equals({text: 'random()', args: []}));
    });
});
