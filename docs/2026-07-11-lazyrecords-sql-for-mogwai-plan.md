---
title: "lazyrecords SQL construction for mogwai-db"
date: 2026-07-11
author: Daniel Bodart
type: plan
status: draft
tags: [plan, lazyrecords, sql, mogwai]
---

# Plan: lazyrecords SQL construction for mogwai-db

**Date:** 2026-07-11
**Repos:** `bodar.ts/packages/lazyrecords` (new nodes) + `mogwai-db` (consumer cutover)
**Status:** plan — awaiting approval to implement

## Goal

Give mogwai-db a **typed, bind-safe SQL construction substrate** from lazyrecords,
replacing the ~92 interpolated-string SQL sites and ~14 hand-maintained parallel
`binds.push` sites in `mogwai-db/src/compiler.ts`. Along the way, flesh out
lazyrecords' SQL AST with the constructs mogwai needs — each classified as
**ANSI** (→ `src/sql/ansi/`) or **SQLite extension** (→ `src/sql/sqlite/`).

### Why (the correctness case)

mogwai builds SQL by string concatenation, tracking parameters in a **separate
`binds[]` array** that must stay in exact textual-placeholder order by hand. That
is the fragile part. The recurring danger pattern (a `json_extract(...)` fragment
appears twice, so its binds must be spliced twice):

```js
// compiler.ts:279  — BETWEEN, json path spliced on both sides
binds.push(...pe.binds, p.values[0], ...pe.binds, p.values[1]);
// compiler.ts:439, 638 — projection value appears in SELECT and WHERE
fb.push(...pe.binds, ...pe.binds);
```

Miscount → silently wrong query. lazyrecords' template core structurally
**separates params from text** (`Value` vs `Text`/`Identifier` tokens) and derives
binds from the finished tree (`sql.values()`), so this entire bug class disappears.

## Decisions locked (from clarifying round)

1. **Scope: reads only.** Target `compileRead` / `traversalCtes` and the read
   projections (`values/id/label/valueMap/elementMap/select/project/count/properties`).
   Writes (`compileAddV/AddE/Drop`, `INSERT … RETURNING`, `DELETE`) stay as-is;
   planned as a follow-up (see §7).
2. **Tests: free to rewrite assertions.** The ~30 exact-SQL `toContain`/`toBe`
   assertions in `mogwai-db/test/compiler.test.ts` may be rewritten to match the
   builder's canonical output. **Hard exception:** `test/performance.test.ts`
   (EXPLAIN QUERY PLAN asserting the `json_extract` expression index engages)
   must still pass — the literal-path splice is a behavioural contract, not
   cosmetic (see §4).
3. **Cutover: wholesale rewrite.** `compiler.ts` stops doing string concatenation
   entirely in one pass; the read path builds a `Sql` tree end-to-end.

## Non-goals / what mogwai does NOT adopt

- **Not** lazyrecords' functional front-end (`toSelect`/`toCompound`, transducers
  → SQL). Wrong altitude: mogwai already has its own IR — the step chain
  `{name,args}[]` (mogwai locked decision #5). No second functional IR.
- **Not** lazyrecords' `Records`/`Connection` executor — it is async
  (`AsyncIterable`). mogwai's `Sql` seam is **synchronous + dual-runtime**
  (`bun:sqlite` / DO `ctx.storage.sql`). Keep mogwai's seam. Adopt the *builder*,
  render to `{text, args}` at the compile boundary, hand that to `store.query`.
- **Not** totallylazy. The template core has **zero** totallylazy dependency
  (verified: `Sql.ts` → `escape.ts` + `Compound/Text/Value/Identifier/Expression`,
  all zero-dep). totallylazy only enters via the front-end we are not taking. So
  mogwai's new dependency is the lazyrecords template core + typed nodes only.

---

## 1. The substrate mogwai consumes

### 1a. Template core (already exists — just export/reuse)

`Expression` → `Compound` (iterable token tree) → flatten to `Text | Identifier |
Value`. `Sql.generate(handler)` + `Sql.values()`. Helpers: `sql`, `SQL`, `text`/
`raw`, `value`, `id`, `list`, `and`, `or`, `not`, `between`.

Rendering to positional `?` + args: **`src/sql/statement/ordinalPlaceholder.ts`**
already does exactly this (`{ text, args }`, `?` placeholders, ANSI identifier
escaping). mogwai renders each compiled `Sql` through it at the boundary.

**Composition property that makes the CTE pipeline expressible:** `Sql extends
Compound`, so a CTE fragment is itself an `Expression` and nests into a larger
`Sql`. mogwai's per-step CTE fragments compose without re-parsing.

### 1b. Typed nodes to build (the classification work)

These are new `Compound` subclasses. Each lands in `ansi/` or `sqlite/` per the
table. mogwai assembles them; they render via the template core.

| # | Construct mogwai emits | ANSI / SQLite | File (new) |
|---|---|---|---|
| N1 | Non-recursive `WITH` CTE prefix (`WITH a AS (…), b AS (…)`) | **ANSI** (SQL:1999) | `ansi/WithClause.ts`, `ansi/CommonTableExpression.ts` |
| N2 | `UNION ALL` (and `UNION`) set operation | **ANSI** | `ansi/SetOperation.ts` |
| N3 | `JOIN … ON …` (inner) | **ANSI** | `ansi/JoinClause.ts` |
| N4 | `ORDER BY col ASC/DESC` (multi-key) | **ANSI** | `ansi/OrderByClause.ts` |
| N5 | Comparison predicates `> >= < <= != ` | **ANSI** | extend `ansi/` predicate family (`ComparisonExpression`) |
| N6 | `IN (…)` / `NOT IN (…)` | **ANSI** | `ansi/InExpression.ts` |
| N7 | `COUNT(*)` (generic function-call + `count` helper) | **ANSI** | `ansi/FunctionCall.ts` |
| N8 | `VALUES (?),(?)` row constructor (inject) | **ANSI** | `ansi/ValuesClause.ts` |
| N9 | `DISTINCT` set quantifier | **ANSI** | `ansi/SetQuantifier.ts` (exists — wire `Distinct`) |
| S1 | `LIMIT m OFFSET n`, incl. `LIMIT -1` no-limit sentinel | **SQLite ext** (ANSI is `OFFSET/FETCH`; `-1` is SQLite-only) | `sqlite/LimitClause.ts` |
| S2 | `json_extract(col,'$.key')` w/ safe-key literal splice | **SQLite ext** | `sqlite/jsonExtract.ts` |
| S3 | `json_each(col)` table-valued function | **SQLite ext** | `sqlite/jsonEach.ts` |
| S4 | `RANDOM()` (order-by shuffle) | **SQLite ext** | `sqlite/random.ts` (or fold into a sqlite fn set) |
| S5 | expression-index DDL `CREATE INDEX … (json_extract(props,'$.k'))` | **SQLite ext** | `sqlite/ExpressionIndex.ts` |

**Precedent for the split:** lazyrecords already divides `ansiMappings()`
(`ColumnTypeMappings.ts`) from `sqliteMappings()` (`sqlite/sqliteMappings.ts`).
The placeholder strategy is likewise dialect-split under `statement/`. New nodes
follow the same convention: standard shape in `ansi/`, SQLite-only spelling in
`sqlite/`.

**Classification rule of thumb applied:** a construct is ANSI if it is in the SQL
standard grammar (CTE, UNION, JOIN, ORDER BY, comparison/IN, COUNT, VALUES,
DISTINCT). It is a SQLite extension if the *spelling* is SQLite-specific even when
the *concept* is standard — `LIMIT`/`LIMIT -1` (standard concept is `FETCH FIRST`),
`json_extract`/`json_each` (SQLite JSON1), `RANDOM()`, expression indexes.

---

## 2. The composable-query question (foundational)

lazyrecords' existing `SelectExpression` is **rigid** — a fixed constructor
`(quantifier, selectList, from, where?)` with no room for WITH/JOIN/ORDER/LIMIT
(the class comment lists them as unimplemented `Option<…>`). mogwai does not emit
that ANSI single-SELECT shape at all; it emits bespoke CTE pipelines.

**Decision:** do **not** mutate/overload the existing `SelectExpression` (it backs
the current `Records` contract — leave it working). Instead the new nodes are
**free-standing composable `Compound`s** that mogwai wires together directly (a
`WithClause` wrapping a body `Sql`, a body built from `SetOperation` over
per-direction `Sql` selects, etc.). This keeps each node small and independently
testable, and leaves lazyrecords' existing library API untouched.

A richer `SelectExpression` that *optionally* carries WITH/ORDER/LIMIT is a
possible later refactor for the records library, but is **out of scope** here —
mogwai does not need it and it would churn the existing contract.

---

## 3. mogwai cutover shape (wholesale)

`compiler.ts` today returns `{ sql: string, binds: any[] }`. After cutover it
builds a `Sql` tree and renders once at the return boundary:

```ts
// one boundary helper, replaces every `{ sql, binds }` literal
function compiled(tree: Sql, shape: Shape, indexKeys: string[]): Compiled {
  const { text, args } = statement(tree);         // ordinalPlaceholder
  return { kind: 'read', sql: text, binds: args, shape, indexKeys };
}
```

Everything downstream (`handler.ts`, `storage.ts` `query(sql, binds)`) is
unchanged — the `Compiled` interface still exposes `sql: string; binds: any[]`.
The rewrite is entirely inside `compiler.ts`'s construction layer.

Concrete before/after (the `has()` `>` branch, compiler.ts:269–271):

```ts
// before
ctes.push(`c${ctes.length} AS (${join} WHERE ${pe.sql} ${P_OPS[p.op]} ?)`);
binds.push(...pe.binds, p.values[0]);

// after — binds fall out of the tree; no parallel array
cte(sql`${join} WHERE ${jsonExtract('n.props', key)} ${op(p.op)} ${value(p.values[0])}`)
```

The `carry()` alias-column glue and CTE naming (`c0,c1,…`) stay as mogwai-local
helpers — they are graph-traversal-specific and not lazyrecords' concern.

---

## 4. Hard constraint: the index-eligible json path

mogwai's hot-property story **requires** `json_extract(n.props,'$.age')` with
`$.age` as a **raw literal** so SQLite matches the on-demand expression index
(`CREATE INDEX … (json_extract(props,'$.age'))`). A bound/escaped path defeats it
(measured ~90× regression; `performance.test.ts` asserts via EXPLAIN QUERY PLAN).

The **`sqlite/jsonExtract.ts` node owns this logic** — cleaner than today, where
it lives in `compiler.ts`'s `propExtract` as an implicit choice of which array to
push to:

```ts
const SAFE_KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;
// safe identifier key → text() (raw, index-eligible, injection-safe by validation)
// exotic key (spaces/dots/unicode) → value() (bound; can't be an index target anyway)
jsonExtract(col, key) =>
  SAFE_KEY.test(key) ? sql`json_extract(${id(col)}, ${text(`'$.${key}'`)})`
                     : sql`json_extract(${id(col)}, '$.' || ${value(key)})`
```

The node also exposes which safe key it spliced, so mogwai keeps reporting
`indexKeys` for `ensureNodePropIndex` (self-tuning index build). The
expression-index DDL builder (S5) emits the matching `CREATE INDEX`.

---

## 5. Phasing (implementation order)

Each phase: build the node(s) in lazyrecords **with their own unit tests**
(render to `{text,args}`, assert both), then land the mogwai consumption.

1. **P0 — substrate & boundary.** Export template core + `ordinalPlaceholder` for
   mogwai. Add the `compiled()` boundary helper. No behaviour change yet.
2. **P1 — SQLite leaf nodes.** `jsonExtract` (S2, w/ index-eligibility + tests
   mirroring `performance.test.ts`), `jsonEach` (S3), `LimitClause` (S1),
   `random` (S4). These are the highest-frequency, highest-risk fragments.
3. **P2 — ANSI predicates.** `ComparisonExpression` (N5), `InExpression` (N6),
   wire into `has()`. Kills the BETWEEN/IN double-splice sites (271/276/279/283).
4. **P3 — ANSI structure.** `WithClause`+`CommonTableExpression` (N1),
   `SetOperation` (N2), `JoinClause` (N3). Migrate `traversalCtes` movement
   (out/in/both/outE/…/UNION ALL) and the CTE prefix.
5. **P4 — ANSI tail.** `OrderByClause` (N4), `DISTINCT` (N9), `COUNT(*)`
   (N7 `FunctionCall`), `ValuesClause` (N8, inject). Migrate the read tail +
   projections (`values/id/label/valueMap/elementMap/select/project/properties`).
6. **P5 — rewrite mogwai tests** to canonical output; confirm `corpus.test.ts`
   100%, `performance.test.ts` green, L3 cucumber score unchanged (ratchet only up).

## 6. Test strategy

- **lazyrecords:** each new node gets a unit test asserting rendered `{text,args}`
  for representative inputs, incl. edge cases (empty `IN`, `LIMIT -1`, safe vs
  exotic json key). Follows existing per-node test convention.
- **mogwai:** rewrite `compiler.test.ts` string assertions to the new canonical
  SQL. `corpus.test.ts` (2177 parses) and the L3 cucumber score are behavioural
  and must not regress. `performance.test.ts` is the non-negotiable gate on the
  json-path index splice.
- Run `mise run ci` in bodar.ts (lazyrecords) and `bun test` in mogwai-db.

## 7. Deferred (explicit follow-ups)

- **Writes:** migrate `compileAddV/AddE`, `compileDrop`, `compileInject`
  mutations. Classify: `INSERT … RETURNING` → **SQLite** (also PG; not ANSI),
  `DELETE … WHERE` → ANSI. `RETURNING` is a clean second ANSI-vs-SQLite example.
- **Records-library enrichment:** if desired, fold N4/N5/N6/N7 + `LIMIT` into a
  richer `SelectExpression` so the functional `toSelect` front-end gains
  order/comparison/pagination (the GAP_ANALYSIS roadmap). Separate track — not
  needed by mogwai.
- **JSR exports:** add the new `ansi/*` and `sqlite/*` node modules to
  lazyrecords' `package.json` `exports` map.

## 8. Risks

- **Whitespace churn:** wholesale rewrite changes exact SQL text → the ~30 pinned
  assertions rewrite (accepted). Keep the builder's output canonical/stable so
  they don't re-churn later.
- **Bundle size:** worker bundle is ~265 KB gzip today; template core + nodes are
  tiny pure TS. Negligible, but re-check `wrangler deploy --dry-run` after cutover.
- **Two-repo change:** lazyrecords nodes (bodar.ts, this worktree) must land/publish
  before mogwai can import them. Sequence: land+version lazyrecords, bump mogwai's
  dependency, then cut over. (Local workspace linking can bridge during dev.)
- **Dialect leakage:** guard against an ANSI node hard-coding a SQLite spelling.
  The `statement/ordinalPlaceholder` handler owns `?` + identifier escaping;
  nothing SQLite-specific belongs in `ansi/`.
