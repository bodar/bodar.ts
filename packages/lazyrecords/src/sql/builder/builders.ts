import {select, SelectExpression, type SelectList} from "../ansi/SelectExpression";
import {from, FromClause} from "../ansi/FromClause";
import {table} from "../ansi/Table";
import {SetQuantifier} from "../ansi/SetQuantifier";
import type {Mapper} from "@bodar/totallylazy/functions/Mapper";
import {type Predicand, PredicatePair, WhereClause} from "../ansi/WhereClause";
import {Transducer} from "@bodar/totallylazy/transducers/Transducer";
import {type FilterTransducer, isFilterTransducer} from "@bodar/totallylazy/transducers/FilterTransducer";
import {isMapTransducer, type MapTransducer} from "@bodar/totallylazy/transducers/MapTransducer";
import {isSelect} from "@bodar/totallylazy/functions/Select";
import {Column, column, star} from "../ansi/Column";
import {isWherePredicate} from "@bodar/totallylazy/predicates/WherePredicate";
import {isProperty, type Property} from "@bodar/totallylazy/functions/Property";
import {isIsPredicate} from "@bodar/totallylazy/predicates/IsPredicate";
import {is} from "../ansi/IsExpression";
import type {Predicate} from "@bodar/totallylazy/predicates/Predicate";
import {isAndPredicate} from "@bodar/totallylazy/predicates/AndPredicate";
import {and, between, Compound, not, or} from "../template/Compound";
import {isOrPredicate} from "@bodar/totallylazy/predicates/OrPredicate";
import {isNotPredicate} from "@bodar/totallylazy/predicates/NotPredicate";
import {isBetweenPredicate} from "@bodar/totallylazy/predicates/BetweenPredicate";

// @ts-ignore
export interface Definition<A> {
    name: string;
}

export function definition<A>(name: string): Definition<A> {
    return {name};
}


export type Supported<A> = FilterTransducer<A> | MapTransducer<A, Partial<A>>;

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

export function toSelectList<A>(mapper: Mapper<A, keyof A>): SelectList {
    if (isSelect(mapper)) {
        return mapper.properties.map(toColumn);
    }
    throw new Error(`Unsupported mapper: ${mapper}`);
}

export function toColumn<A>(property: Property<A, keyof A>): Column {
    return column(String(property.key));
}

export function toFromClause<A>(definition: Definition<A>): FromClause {
    return from(table(definition.name));
}

export function toPredicand<A>(mapper: Mapper<A, keyof A>): Predicand {
    if (isProperty(mapper)) {
        return toColumn(mapper);
    }
    throw new Error(`Unsupported Mapper: ${mapper}`);
}

function mergeWhereClause(oldClause: WhereClause | undefined, newCompound: Compound): WhereClause {
    if (!oldClause) return new WhereClause(newCompound);
    return new WhereClause(and(oldClause.expression, newCompound));
}

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
