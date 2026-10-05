# bodar.ts
[![Build](https://github.com/bodar/bodar.ts/actions/workflows/build.yml/badge.svg)](https://github.com/bodar/bodar.ts/actions/workflows/build.yml)

A monorepo containing TypeScript libraries for functional programming, database access, dependency injection, JSX and reactive dataflow.

## Packages

### [@bodar/totallylazy](./packages/totallylazy)
A comprehensive functional programming library providing composable predicates, transducers, parsers, comparators, and collection utilities. Features lazy evaluation, parser combinators, and a complete JSON grammar with JSDoc custom type support.

### [@bodar/lazyrecords](./packages/lazyrecords)
A type-safe SQL query builder that bridges functional programming with SQL. Convert functional predicates and transducers into parameterized SQL queries, or write them with SQL template literals. Supports PostgreSQL and SQLite with ANSI SQL foundations (DuckDB via the adapter packages below).

### [@bodar/lazyrecords-duckdb](./packages/lazyrecords-duckdb)
DuckDB native adapter for lazyrecords using `@duckdb/node-api`.

### [@bodar/lazyrecords-duckdb-wasm](./packages/lazyrecords-duckdb-wasm)
DuckDB WASM adapter for lazyrecords using `@duckdb/duckdb-wasm`.

### [@bodar/yadic](./packages/yadic)
A lightweight dependency injection container with lazy initialization. Uses property getters that convert to immutable read-only properties on first access for optimal performance.

### [@bodar/jsx2dom](./packages/jsx2dom)
An extremely thin adapter to convert JSX/TSX to native DOM method calls. Works in the browser, at the edge, server side or in unit tests using [linkedom](https://github.com/WebReflection/linkedom) without any global namespace pollution.

### [@bodar/dataflow](./packages/dataflow)
A reactive dataflow library inspired by Observable Framework but grounded in HTML rather than markdown. Adds reactivity to standard HTML for static, server, edge or client rendered content. Early days - not ready for use yet.

## Monorepo Structure

```
bodar.ts/
├── packages/                     # All publishable packages
│   ├── totallylazy/              # Functional programming library
│   ├── lazyrecords/              # SQL query builder
│   ├── lazyrecords-duckdb/       # DuckDB native adapter for lazyrecords
│   ├── lazyrecords-duckdb-wasm/  # DuckDB WASM adapter for lazyrecords
│   ├── yadic/                    # Dependency injection
│   ├── jsx2dom/                  # JSX to native DOM calls
│   └── dataflow/                 # Reactive HTML dataflow
├── run                           # Main build/test script
├── bootstrap.sh                  # Installs dependencies via mise
└── package.json                  # Workspace configuration
```

## Quick Start

The `./run` command handles all build, test, and development tasks. It requires [mise](https://mise.jdx.dev/getting-started.html) and on first use installs the required tools (see `mise.toml`):

```bash
# Run tests
./run test

# Type check
./run check

# Run specific test file
./run test packages/totallylazy/test/predicates/EqualsPredicate.test.ts

# Development mode (watch)
./run dev

# Clean and rebuild
./run build

# Test with coverage
./run coverage
```

The bootstrap process installs the correct versions of all tools (Bun, Node, etc.) via mise.

## Design Decisions

### No Barrel Files
This project does NOT use barrel files (index.ts files that re-export everything). Each module should be imported directly from its source file. Barrel files have several issues including circular dependencies, larger bundle sizes, and slower TypeScript compilation.

Top level tasks
* [x] Basic structure
* [x] Run script
  * [x] tests
  * [x] lint
  * [x] typecheck
  * [x] CI target
    * [x] Publish to JSR
    * [x] TSDoc/JSDoc
    * [ ] Tests -> Docs

* utterlyidle / http4d
