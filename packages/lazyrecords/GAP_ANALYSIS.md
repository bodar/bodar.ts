# Gap Analysis: Java vs TypeScript lazyrecords

This document compares the Java lazyrecords implementation (`/home/dan/Projects/lazyrecords`) with the TypeScript implementation to identify missing features and guide future development.

## 1. Mutation Operations

The Java implementation supports map/dictionary-like semantics for data modification:

| Operation | Java | TypeScript | SQL Equivalent | Description |
|-----------|------|------------|----------------|-------------|
| `add(definition, records)` | ✅ | ❌ | INSERT | Unconditionally insert new records |
| `set(definition, pairs)` | ✅ | ❌ | UPDATE | Update only if record exists (no-op otherwise) |
| `put(definition, pairs)` | ✅ | ❌ | UPSERT | Insert if not exists, update if exists |
| `remove(definition, predicate?)` | ✅ | ❌ | DELETE | Delete records, optionally filtered by predicate |

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

---

## 2. Functional → SQL Mappings

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

## 3. Contract Tests

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

### TypeScript Current State

Each implementation has its own test file with similar but not identical tests:
- `DuckDBRecords.test.ts` - Most comprehensive
- `SQLiteRecords.test.ts` - Basic tests
- `PostgresRecords.test.ts` - Single skipped test

### Recommended TypeScript Approach

Create `RecordsContract.ts` that exports a function to generate tests:

```typescript
export function recordsContract(
    name: string,
    createRecords: () => Promise<Records>,
    cleanup?: () => Promise<void>
) {
    describe(`${name} contract`, () => {
        let records: Records;

        beforeEach(async () => {
            records = await createRecords();
            // Setup test data
        });

        afterEach(async () => {
            await cleanup?.();
        });

        it('supports filter with equals', async () => { ... });
        it('supports filter with between', async () => { ... });
        it('supports map with select', async () => { ... });
        // ... shared tests
    });
}

// In SQLiteRecords.test.ts
recordsContract('SQLiteRecords', async () => {
    const db = new Database(':memory:');
    // Create tables, seed data
    return new SQLiteRecords(db);
});
```

---

## 4. Escape Hatch

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

### TypeScript Current State

The `query()` method currently just returns `AsyncIterable<A>` instead of `Promise<Iterable<A>>` - same SQL generation, different return type. Not an escape hatch.

### Recommended Change

Repurpose `query()` to accept a `Sql` template literal:

```typescript
interface Records {
    // Existing functional query
    get<A>(definition: Definition<A>, ...transducers: Transducer[]): Promise<Iterable<A>>;

    // Escape hatch for raw SQL
    query<A>(sql: Sql): AsyncIterable<A>;

    // Escape hatch for mutations
    execute(sql: Sql): Promise<number>;
}

// Usage
const results = records.query<User>(SQL`
    SELECT * FROM users
    WHERE age > ${minAge}
    AND status = ${status}
`);

const affected = await records.execute(SQL`
    UPDATE users SET status = ${newStatus} WHERE id = ${userId}
`);
```

---

## 5. Priority Recommendations

### Phase 1: Foundation
1. **Escape hatch** - Change `query()` to accept `Sql` template, add `execute()` for mutations
2. **Contract tests** - Create shared test infrastructure

### Phase 2: Core Mutations
3. **`add()`** - INSERT operation
4. **`remove()`** - DELETE operation
5. **`set()`** - UPDATE operation
6. **`put()`** - UPSERT operation

### Phase 3: Common Predicates
7. **Comparison predicates** - `greaterThan`, `lessThan`, `greaterThanOrEqualTo`, `lessThanOrEqualTo`
8. **`in()` predicate** - For set membership
9. **String predicates** - `startsWith`, `contains`, `endsWith`

### Phase 4: Query Features
10. **Pagination** - `drop()`, `take()`
11. **Sorting** - `sortBy()` with comparators
12. **Aggregations** - `count`, `sum`, `avg`, `max`, `min`

### Phase 5: Advanced
13. **Joins** - via `flatMap()`
14. **Group by** - `groupBy()`
15. **Distinct** - `unique()`

---

## 6. Architecture Notes

### Java Patterns Worth Adopting

1. **Lazy SQL Building** - Java's `SqlSequence` builds AST without executing until iterator consumed
2. **Grammar Interface** - `SqlGrammar` allows swapping SQL dialects (ANSI, MySQL, Oracle, PostgreSQL)
3. **Batch Operations** - Mutations execute in batches via PreparedStatement batching
4. **Expression Composition** - Expressions can be inspected/modified before execution

### TypeScript Advantages

1. **Template Literals** - `SQL\`...\`` is more ergonomic than Java's Expression builder
2. **Type Safety** - Generic definitions provide better compile-time checking
3. **Async Iterables** - Native streaming support without custom iterator classes

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
- `src/sql/postgres/PostgresRecords.ts` - PostgreSQL implementation
- `src/sql/sqlite/SQLiteRecords.ts` - SQLite implementation
- `src/sql/duckdb/DuckDBRecords.ts` - DuckDB implementation
