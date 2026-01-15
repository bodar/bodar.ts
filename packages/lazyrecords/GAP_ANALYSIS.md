# Gap Analysis: Java vs TypeScript lazyrecords

This document compares the Java lazyrecords implementation (`/home/dan/Projects/lazyrecords`) with the TypeScript implementation to identify missing features and guide future development.

## 1. Mutation Operations

The Java implementation supports map/dictionary-like semantics for data modification:

| Operation | Java | TypeScript | SQL Equivalent | Description |
|-----------|------|------------|----------------|-------------|
| `add(definition, records)` | ✅ | ✅ | INSERT | Unconditionally insert new records |
| `set(definition, pairs)` | ✅ | ❌ | UPDATE | Update only if record exists (no-op otherwise) |
| `put(definition, pairs)` | ✅ | ❌ | UPSERT | Insert if not exists, update if exists |
| `remove(definition, predicate?)` | ✅ | ✅ | DELETE | Delete records, optionally filtered by predicate |

### Java Semantics

**`add(definition, records)`** - Pure INSERT
```java
// Maps each record to INSERT statement, executes in batch
public Number add(Definition definition, Sequence<Record> records) {
    return update(records.map(insertStatement(grammar, definition)));
}
```

**`set(definition, pairs)`** - UPDATE (only if exists)
```java
// Pair<Predicate, Record> - predicate identifies which record to update
// If predicate matches nothing, does nothing
public Number set(Definition definition, Sequence<Pair<Predicate, Record>> records) {
    return records.map(update(definition, false)).reduce(sum());
}
```

**`put(definition, pairs)`** - UPSERT (insert or update)
```java
// Same as set, but inserts if predicate matches nothing
public Number put(Definition definition, Sequence<Pair<Predicate, Record>> records) {
    return records.map(update(definition, true)).reduce(sum());
}
```

The internal `update(definition, add)` method:
1. Filters records matching predicate
2. Removes matching records
3. Re-inserts with merged values
4. If `add=true` and no matches, inserts new record

### TypeScript Implementation

**`add(definition, records)`** - Implemented
```typescript
// Inserts records one at a time, returns total count
add<A>(definition: Definition<A>, records: Iterable<A>): Promise<number>
```

**`remove(definition, predicate?)`** - Implemented
```typescript
// Deletes matching records (all if no predicate), returns count
remove<A>(definition: Definition<A>, predicate?: Predicate<A>): Promise<number>
```

---

## 2. Schema/DDL Support

| Operation | Java | TypeScript | SQL Equivalent | Description |
|-----------|------|------------|----------------|-------------|
| Create table | ✅ | ✅ | CREATE TABLE IF NOT EXISTS | Create table from definition |
| Drop table | ✅ | ✅ | DROP TABLE IF EXISTS | Remove table |
| Type mapping | ✅ | ✅ | Column types | Map TS types to SQL types |

### TypeScript Implementation

**Keyword type** - Runtime type information for schema generation:
```typescript
const id = keyword<User, 'id'>('id', Number);
const name = keyword<User, 'name'>('name', String);
const active = keyword<User, 'active'>('active', Boolean);
```

**Type mappings** per database:
- `Number` → `integer`
- `String` → `text`
- `Boolean` → `boolean`
- `Date` → `timestamp`
- `BigInt` → `bigint`

**DDL execution** via `execute()`:
```typescript
await records.execute(CreateTableStatement(definition));
await records.execute(DropTableStatement(definition));
```

---

## 3. Functional → SQL Mappings

### Currently Supported in TypeScript

| Operation | Predicate/Transducer | SQL Output |
|-----------|---------------------|------------|
| Filter | `where(property, is(value))` | `WHERE column IS NULL` or `WHERE column = ?` |
| Filter | `where(property, between(a, b))` | `WHERE column BETWEEN ? AND ?` |
| Filter | `and(p1, p2, ...)` | `(... AND ... AND ...)` |
| Filter | `or(p1, p2, ...)` | `(... OR ... OR ...)` |
| Filter | `not(predicate)` | `NOT (...)` |
| Map | `select(prop1, prop2)` | `SELECT col1, col2` |

### Missing in TypeScript (Present in Java)

| Operation | Predicate/Transducer | SQL Output | Priority |
|-----------|---------------------|------------|----------|
| Filter | `greaterThan(value)` | `WHERE column > ?` | High |
| Filter | `greaterThanOrEqualTo(value)` | `WHERE column >= ?` | High |
| Filter | `lessThan(value)` | `WHERE column < ?` | High |
| Filter | `lessThanOrEqualTo(value)` | `WHERE column <= ?` | High |
| Filter | `in(values)` | `WHERE column IN (?, ?, ...)` | High |
| Filter | `startsWith(value)` | `WHERE column LIKE ?%` | Medium |
| Filter | `contains(value)` | `WHERE column LIKE %?%` | Medium |
| Filter | `endsWith(value)` | `WHERE column LIKE %?` | Medium |
| Sort | `sortBy(comparator)` | `ORDER BY column ASC/DESC` | High |
| Pagination | `drop(n)` | `OFFSET n` | High |
| Pagination | `take(n)` | `LIMIT n` / `FETCH NEXT n ROWS ONLY` | High |
| Join | `flatMap(join(...))` | `JOIN ... ON ...` | Medium |
| Aggregate | `reduce(count())` | `SELECT COUNT(*)` | Medium |
| Aggregate | `reduce(sum(col))` | `SELECT SUM(col)` | Medium |
| Aggregate | `reduce(avg(col))` | `SELECT AVG(col)` | Medium |
| Aggregate | `reduce(max(col))` | `SELECT MAX(col)` | Medium |
| Aggregate | `reduce(min(col))` | `SELECT MIN(col)` | Medium |
| Group | `groupBy(property)` | `GROUP BY column` | Medium |
| Distinct | `unique()` | `SELECT DISTINCT` | Low |

---

## 4. Contract Tests

### Java Approach

The Java implementation uses an abstract contract test class that all implementations extend:

```java
// RecordsContract.java - 792 lines of shared tests
public abstract class RecordsContract<T extends Records> {
    protected abstract T createRecords();

    @Before
    public void setupRecords() {
        records = createRecords();
        // Setup test data
    }

    @Test
    public void supportsFilter() { ... }

    @Test
    public void supportsJoin() { ... }

    // ... many more tests
}

// SqlRecordsTest.java
public class SqlRecordsTest extends RecordsContract<Records> {
    @Override
    protected Records createRecords() {
        return new SqlRecords(connection, mappings, grammar, logger);
    }

    // Can add SQL-specific assertions
    protected void assertSql(String expected) {
        assertEquals(expected, sql());
    }
}
```

### TypeScript Implementation (Complete)

`RecordsContract.ts` exports a factory function that generates shared tests:

```typescript
export function RecordsContract(
    name: string,
    factory: RecordsFactory
) {
    describe(`${name}`, () => {
        // Shared test data and setup
        const users = definition<User>('users', id, firstName, lastName, age);

        it('supports get with definition', async () => { ... });
        it('supports query (async iterable)', async () => { ... });
        it('supports filter with where/is', async () => { ... });
        it('supports filter with where/is null', async () => { ... });
        it('supports filter with and', async () => { ... });
        it('supports filter with or', async () => { ... });
        it('supports filter with not', async () => { ... });
        it('supports filter with between', async () => { ... });
        it('supports map with select', async () => { ... });
        it('supports add and returns count', async () => { ... });
        it('supports remove all', async () => { ... });
        it('supports remove with predicate', async () => { ... });
    });
}
```

**Implementations tested:**
- SQLiteRecords - Full contract
- DuckDBRecords - Full contract
- PostgresRecords - Skipped by default (requires running database)

---

## 5. Escape Hatch

### Java Implementation

The Java version provides direct SQL execution via the `Queryable<Expression>` interface:

```java
// Raw SELECT
public Sequence<Record> query(Expression expression, Sequence<Keyword<?>> definitions) {
    return new SqlIterator(sqlRecords, expression, definitions);
}

// Raw INSERT/UPDATE/DELETE
public Number update(Expression... expressions) {
    // Executes statements in batch
}

// Expression builder
Expression sql = Expressions.expression("SELECT * FROM users WHERE age > ?", 18);
Sequence<Record> results = records.query(sql, userDefinition.fields());
```

### TypeScript Implementation (Partial)

The `execute()` method provides an escape hatch for DDL and raw SQL expressions:

```typescript
interface Records {
    // Functional queries
    get<A>(definition: Definition<A>, ...transducers: Transducer[]): Promise<Iterable<A>>;
    query<A>(definition: Definition<A>, ...transducers: Transducer[]): AsyncIterable<A>;

    // Escape hatch for DDL/raw expressions
    execute(expression: Expression): Promise<number>;
}

// Usage
await records.execute(CreateTableStatement(users));
await records.execute(DropTableStatement(users));
```

### Potential Enhancement

Add support for raw SQL via template literals:

```typescript
// Raw SELECT with template literal
const results = records.rawQuery<User>(SQL`
    SELECT * FROM users
    WHERE age > ${minAge}
    AND status = ${status}
`);

// Raw mutation with template literal
const affected = await records.rawExecute(SQL`
    UPDATE users SET status = ${newStatus} WHERE id = ${userId}
`);
```

---

## 6. Priority Recommendations

### Completed

- ✅ **Contract tests** - Shared test infrastructure via `RecordsContract.ts`
- ✅ **`add()`** - INSERT operation
- ✅ **`remove()`** - DELETE operation
- ✅ **Schema/DDL** - CREATE TABLE, DROP TABLE with Keyword type system

### Phase 1: Core Mutations

1. **`set()`** - UPDATE operation
2. **`put()`** - UPSERT operation
3. **Batch insert optimization** - Currently inserts one-by-one

### Phase 2: Common Predicates

4. **Comparison predicates** - `greaterThan`, `lessThan`, `greaterThanOrEqualTo`, `lessThanOrEqualTo`
5. **`in()` predicate** - For set membership
6. **String predicates** - `startsWith`, `contains`, `endsWith`

### Phase 3: Query Features

7. **Pagination** - `drop()`, `take()`
8. **Sorting** - `sortBy()` with comparators
9. **Aggregations** - `count`, `sum`, `avg`, `max`, `min`

### Phase 4: Advanced

10. **Joins** - via `flatMap()`
11. **Group by** - `groupBy()`
12. **Distinct** - `unique()`

---

## 7. Architecture Notes

### Java Patterns Worth Adopting

1. **Lazy SQL Building** - Java's `SqlSequence` builds AST without executing until iterator consumed
2. **Grammar Interface** - `SqlGrammar` allows swapping SQL dialects (ANSI, MySQL, Oracle, PostgreSQL)
3. **Batch Operations** - Mutations execute in batches via PreparedStatement batching
4. **Expression Composition** - Expressions can be inspected/modified before execution

### TypeScript Advantages

1. **Template Literals** - `SQL\`...\`` is more ergonomic than Java's Expression builder
2. **Type Safety** - Generic definitions provide better compile-time checking
3. **Async Iterables** - Native streaming support without custom iterator classes
4. **Keyword Type** - Runtime type information enables automatic schema generation

### Key Files Reference

**Java:**
- `SqlRecords.java` - Main implementation
- `AbstractRecords.java` - Mutation algorithms (set/put logic)
- `AnsiSqlGrammar.java` - SQL generation
- `SqlSequence.java` - Lazy query builder
- `RecordsContract.java` - Contract tests

**TypeScript:**
- `src/sql/Records.ts` - Interface definition
- `src/sql/builder/builders.ts` - Transducer → SQL translation
- `src/sql/template/Sql.ts` - Template literal system
- `src/Keyword.ts` - Runtime type information for schema generation
- `src/sql/ansi/AnsiMappings.ts` - ANSI SQL type mappings
- `src/sql/postgres/PostgresRecords.ts` - PostgreSQL implementation
- `src/sql/sqlite/SQLiteRecords.ts` - SQLite implementation
- `src/sql/duckdb/DuckDBRecords.ts` - DuckDB implementation
- `test/sql/RecordsContract.ts` - Shared contract tests
