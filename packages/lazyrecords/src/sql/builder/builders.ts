/**
 * @module
 *
 * SQL query builders for constructing type-safe SELECT statements.
 */

import {select, SelectExpression, type SelectList} from "../ansi/SelectExpression.ts";
import {from, FromClause} from "../ansi/FromClause.ts";
import {table} from "../ansi/Table.ts";
import {SetQuantifier} from "../ansi/SetQuantifier.ts";
import type {Mapper} from "@bodar/totallylazy/functions/Mapper.ts";
import {type Predicand, PredicatePair, WhereClause} from "../ansi/WhereClause.ts";
import {type Transducer} from "@bodar/totallylazy/transducers/Transducer.ts";
import {type FilterTransducer, isFilterTransducer} from "@bodar/totallylazy/transducers/FilterTransducer.ts";
import {isMapTransducer, type MapTransducer} from "@bodar/totallylazy/transducers/MapTransducer.ts";
import {isSelect} from "@bodar/totallylazy/functions/Select.ts";
import {Column, column, star} from "../ansi/Column.ts";
import {isWherePredicate} from "@bodar/totallylazy/predicates/WherePredicate.ts";
import type {Property} from "@bodar/totallylazy/functions/Property.ts";
import {isKeyword} from "../../Keyword.ts";
import {isIsPredicate} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {is} from "../ansi/IsExpression.ts";
import type {Predicate} from "@bodar/totallylazy/predicates/Predicate.ts";
import {isAndPredicate} from "@bodar/totallylazy/predicates/AndPredicate.ts";
import {and, between, Compound, not, or} from "../template/Compound.ts";
import {isOrPredicate} from "@bodar/totallylazy/predicates/OrPredicate.ts";
import {isNotPredicate} from "@bodar/totallylazy/predicates/NotPredicate.ts";
import {isBetweenPredicate} from "@bodar/totallylazy/predicates/BetweenPredicate.ts";
import type {Keyword} from "../../Keyword.ts";

/** Represents a table definition with typed fields for SQL query and schema generation. */
// @ts-ignore
export interface Definition<A> {
    name: string;
    fields: readonly Keyword<A, keyof A>[];
}

/** Creates a table definition for use in SQL query building and schema operations. */
export function definition<A>(name: string, fields: readonly Keyword<A, keyof A>[]): Definition<A> {
    return {name, fields};
}

/** Union type of supported transducers for SQL query building. */
export type Supported<A> = FilterTransducer<A> | MapTransducer<A, Partial<A>>;

/** Converts a table definition and transducers into a type-safe SQL SELECT expression. */
export function toSelect<A>(definition: Definition<A>): SelectExpression;
export function toSelect<A, B>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>): SelectExpression;
export function toSelect<A, B, C>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>): SelectExpression;
export function toSelect<A, B, C, D>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>): SelectExpression;
export function toSelect<A, B, C, D, E>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>, e: Transducer<D, E> & Supported<D>): SelectExpression;
export function toSelect<A, B, C, D, E, F>(definition: Definition<A>, b: Transducer<A, B> & Supported<A>, c: Transducer<B, C> & Supported<B>, d: Transducer<C, D> & Supported<C>, e: Transducer<D, E> & Supported<D>, f: Transducer<E, F> & Supported<E>): SelectExpression;
export function toSelect<A>(definition: Definition<A>, ...transducers: readonly Supported<A>[]): SelectExpression ;

export function toSelect<A>(definition: Definition<A>, ...transducers: readonly Supported<A>[]): SelectExpression {
    return transducers.reduce((expression, transducer) => {
        if (isMapTransducer(transducer)) {
            return select(expression.setQuantifier, toSelectList(transducer.mapper), expression.fromClause, expression.whereClause);
        }
        if (isFilterTransducer(transducer)) {
            return select(expression.setQuantifier, expression.selectList, expression.fromClause, mergeWhereClause(expression.whereClause, toCompound(transducer.predicate)));
        }

        return expression;
    }, select(SetQuantifier.All, star, toFromClause(definition)));
}

/** Converts a mapper function to a SQL SELECT list of columns. */
export function toSelectList<A>(mapper: Mapper<A, keyof A>): SelectList {
    if (isSelect(mapper)) {
        return mapper.properties.map(toColumn);
    }
    throw new Error(`Unsupported mapper: ${mapper}`);
}

/** Converts a property to a SQL column reference. */
export function toColumn<A>(property: Property<A, keyof A>): Column {
    return column(String(property.key));
}

/** Converts a table definition to a SQL FROM clause. */
export function toFromClause<A>(definition: Definition<A>): FromClause {
    return from(table(definition.name));
}

/** Converts a mapper to a SQL predicand for use in WHERE clauses. */
export function toPredicand<A>(mapper: Mapper<A, keyof A>): Predicand {
    if (isKeyword(mapper)) {
        return toColumn(mapper);
    }
    throw new Error(`Unsupported Mapper: ${mapper}`);
}

function mergeWhereClause(oldClause: WhereClause | undefined, newCompound: Compound): WhereClause {
    if (!oldClause) return new WhereClause(newCompound);
    return new WhereClause(and(oldClause.expression, newCompound));
}

/** Converts a totallylazy predicate to a SQL compound expression. */
export function toCompound<A>(predicate: Predicate<A>): Compound {
    if (isWherePredicate(predicate)) {
        return new PredicatePair(toPredicand(predicate.mapper), toCompound(predicate.predicate));
    }
    if (isAndPredicate(predicate)) {
        return and(...predicate.predicates.map(toCompound));
    }
    if (isOrPredicate(predicate)) {
        return or(...predicate.predicates.map(toCompound));
    }
    if (isNotPredicate(predicate)) {
        return not(toCompound(predicate.predicate));
    }
    if (isIsPredicate(predicate)) {
        return is(predicate.value);
    }
    if (isBetweenPredicate(predicate)) {
        return between(predicate.start, predicate.end);
    }
    throw new Error(`Unsupported Predicate: ${predicate}`);
}
