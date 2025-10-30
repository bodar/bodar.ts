---
date: 2025-10-30T18:08:24+0000
researcher: Daniel Worthington-Bodart
git_commit: 1a54ea52c4e38cb6895edbf020f9d4ed584204df
branch: master
repository: bodar.ts
topic: "Feature delta between old totallylazy.js and new totallylazy rewrite"
tags: [research, codebase, totallylazy, feature-comparison, migration]
status: complete
last_updated: 2025-10-30
last_updated_by: Daniel Worthington-Bodart
---

# Research: Feature Delta Between totallylazy.js and @bodar/totallylazy

**Date**: 2025-10-30T18:08:24+0000
**Researcher**: Daniel Worthington-Bodart
**Git Commit**: 1a54ea52c4e38cb6895edbf020f9d4ed584204df
**Branch**: master
**Repository**: bodar.ts

## Research Question
Analyze the old totallylazy.js project and compare it to the new totallylazy rewrite to identify all features that haven't been implemented yet. This analysis focuses on understanding at a high level what still needs to be built in the new implementation.

## Summary

The new @bodar/totallylazy rewrite has successfully implemented the core functional programming primitives (sequences, transducers, predicates, parser combinators, comparators) but lacks significant functionality from the old totallylazy.js:

1. **18 missing transducers** including essential operations like `take`, `drop`, `first`, `last`, `sort`, `unique`, `scan`, `reduce`
2. **3 complete domain modules** are missing: Money (with 174 currencies), Dates (with i18n), and HTTP (client/server)
3. **Advanced data structures** missing: AVL Tree (self-balancing) and Trie (prefix tree with fuzzy search)
4. **System integration features** missing: File system operations, command execution, pattern matching
5. **Utility functions** missing: Caching/memoization, array utilities, number utilities, character utilities

The new implementation also differs philosophically - it focuses exclusively on pure functional programming with no async support in transducers and no Node.js-specific integrations.

## Detailed Findings

### 1. Transducers (18 Missing Operations)

The old implementation has 23 transducers with both sync and async support, while the new has only 5 with sync-only support.

#### Missing Collection Operations (7)
- `take` - Limit to first N elements
- `takeWhile` - Take while condition holds
- `drop` - Skip first N elements
- `dropWhile` - Skip while condition holds
- `first` - Get first element
- `last` - Get last element
- `windowed` - Sliding window with size/step/remainder options

#### Missing Transformation Operations (3)
- `scan` - Accumulating map (emits intermediate values unlike reduce)
- `zip` - Combine two iterables into tuples
- `zipWithIndex` - Zip with sequential index numbers

#### Missing Filtering/Deduplication (2)
- `dedupe` - Remove consecutive duplicates
- `unique` - Remove all duplicates using AVL tree for efficiency

#### Missing Search/Sort/Reduction (4)
- `sort` - Sort using comparator
- `reduce` - Reduce to single value (composition of scan + last)
- `find` - Find first matching element (composition of filter + first)
- `single` - Extract single value with error handling

#### Missing Utility (2)
- `identity` - Pass-through transducer
- `decompose` - Introspect composite transducers

#### API Differences
- Old: Class-based with `sync()` and `async_()` methods
- New: Function-based with single call signature, sync-only
- New adds `toString()` and type branding via symbols

### 2. Money Module (Complete Module Missing)

The old implementation provides comprehensive internationalized money handling:

#### Features
- **174 ISO currencies** with decimal places and symbols ([currencies.ts:7-1123](../../../totallylazy.js/src/money/currencies.ts))
- **Flexible parsing** with locale awareness ([flexible-parsing.ts](../../../totallylazy.js/src/money/flexible-parsing.ts))
- **Currency symbol disambiguation** for $, £, ¥ across countries
- **Decimal separator inference** (handles 1.234,56 vs 1,234.56)
- **Multiple parsing strategies** (prefer, infer from locale)
- **Format to parts** with polyfill for older browsers
- **Regex pattern building** from locale data
- **Implicit currency parsing** (amounts without symbols)

#### Key Components
```typescript
interface Money {
    currency: string;
    amount: number;
}
```

Functions: `parse()`, `format()`, `parser()`, `symbolFor()`, `decimalsFor()`

### 3. Dates Module (Complete Module Missing)

The old implementation provides comprehensive internationalized date handling:

#### Features
- **Safe date construction** with validation ([core.ts:9-17](../../../totallylazy.js/src/dates/core.ts))
- **Custom format strings** (dd/MM/yyyy, MMMM d yyyy, etc.)
- **Locale-aware parsing** with month/weekday names
- **Year inference strategies**:
  - Sliding 50-year window
  - Before/after pivot date
  - From weekday matching
- **Non-Latin numeral support** (Arabic, etc.)
- **Days arithmetic** (add, subtract, between)
- **Format to parts** with polyfill
- **Clock abstraction** for testing

#### Key Components
```typescript
enum Month { January = 1, February, ..., December }
enum Weekday { Monday = 1, Tuesday, ..., Sunday }
```

Functions: `date()`, `parse()`, `format()`, `monthOf()`, `weekdayOf()`, `Days.between()`

### 4. HTTP Module (Complete Module Missing)

The old implementation provides platform-agnostic HTTP abstractions:

#### Features
- **Handler-based architecture** for composability
- **RFC 3986 compliant URI parsing**
- **Streaming body support** with AsyncIterator
- **Node.js implementation** (client + server)
- **Browser implementation** (XMLHttpRequest)
- **Typed headers and methods**
- **Filter middleware pattern**

#### Key Components
```typescript
interface Handler {
    handle(request: Request): Promise<Response>;
}

interface Server extends Handler, Closeable<void> {
    url(): Promise<Uri>
}
```

Functions: `request()`, `get()`, `post()`, `response()`, `ok()`, `notFound()`

### 5. Advanced Data Structures (Missing)

#### AVL Tree ([avltree.ts](../../../totallylazy.js/src/avltree.ts))
- Self-balancing binary search tree
- O(log n) insert, delete, lookup
- Immutable/persistent (operations return new trees)
- Supports iteration (keys, values, entries)
- Used internally by `unique` transducer

#### Trie ([trie.ts](../../../totallylazy.js/src/trie.ts))
- Prefix tree for array-keyed storage
- O(m) operations where m is key length
- Prefix matching support

#### PrefixTree ([trie.ts:120-174](../../../totallylazy.js/src/trie.ts))
- String-optimized trie
- **Fuzzy search with Levenshtein distance**
- Case and accent insensitive matching with Intl.Collator
- Used for autocomplete/search features

### 6. System Integration Features (Missing)

#### File System Operations ([files.ts](../../../totallylazy.js/src/files.ts))
- `File` class with comprehensive operations:
  - Navigation: `child()`, `children()`, `descendants()`
  - Reading: `bytes()`, `content()`, `read()` stream
  - Writing: `append()`, `write()` stream
  - Operations: `mkdir()`, `delete()`, `copy()`
  - Properties: `exists`, `isDirectory`, `stats`

#### Command Execution ([run.ts](../../../totallylazy.js/src/run.ts))
- `run()` function spawning child processes
- Streaming stdout/stderr as async iterable
- Returns exit code

#### Pattern Matching ([pattern.ts](../../../totallylazy.js/src/pattern.ts))
- `match()`, `case_()`, `default_()` functions
- Deep structural pattern matching
- Regex pattern extraction
- Nested pattern composition

### 7. Utility Functions (Missing)

#### Caching/Memoization
- Old: `@cache` decorator for methods, `caching()` for functions
- New: Only `@lazy` decorator for getters

#### Array Utilities
- Old: `flatten()`, `unique()`
- New: Only `toPromiseArray()`

#### Number Utilities
- Old: `increment()`, `add()`, `subtract()`, `sum()`
- New: None

#### Character Utilities
- Old: `NamedRegExp` class, `prefix()`, `suffix()`, `different()`, `removeUnicodeMarkers()`
- New: Only basic `characters()`

#### Other Missing
- Proxy utilities for invocation recording
- Node.js environment detection
- Identity and safe get functions

## Architecture Documentation

### Old Implementation Philosophy
- **Kitchen sink approach**: Includes everything from FP primitives to system integration
- **Dual sync/async**: All transducers support both modes
- **Node.js integration**: File system, process execution, HTTP server
- **Domain modeling**: Complete solutions for money, dates, HTTP
- **Browser compatibility**: Polyfills and fallbacks

### New Implementation Philosophy
- **Pure functional focus**: Only FP primitives, no I/O or side effects
- **Sync-only transducers**: Simpler mental model
- **Platform agnostic**: No Node.js dependencies
- **Subpath exports**: Every module individually exported for tree-shaking
- **Self-describing APIs**: Everything has meaningful `toString()`
- **Type safety first**: Extensive overloads for type inference

## Code References

### Old totallylazy.js (in project root: `../../../totallylazy.js/`)
- Main source: `../../../totallylazy.js/src/`
- Transducers: `../../../totallylazy.js/src/transducers/` (23 files)
- Money: `../../../totallylazy.js/src/money/` (6 files, 1,800+ lines)
- Dates: `../../../totallylazy.js/src/dates/` (8 files, 1,000+ lines)
- HTTP: `../../../totallylazy.js/src/http/` (3 files, 468 lines)
- Data structures: `../../../totallylazy.js/src/avltree.ts`, `../../../totallylazy.js/src/trie.ts`

### New @bodar/totallylazy
- Main source: `packages/totallylazy/src/`
- Transducers: `packages/totallylazy/src/transducers/` (5 files)
- Collections: `packages/totallylazy/src/collections/` (5 files)
- Predicates: `packages/totallylazy/src/predicates/` (11 files)
- Parsers: `packages/totallylazy/src/parsers/` (16 files)
- Comparators: `packages/totallylazy/src/comparators/` (5 files)
- Functions: `packages/totallylazy/src/functions/` (8 files)
- Grammars: `packages/totallylazy/src/grammars/` (4 files)

## Migration Priority Recommendations

Based on usage patterns and dependencies, the suggested implementation order:

### High Priority (Core Functionality)
1. **Missing transducers** - Essential for sequence operations
   - `first`, `last`, `take`, `drop` - Basic collection operations
   - `scan`, `reduce` - Aggregation operations
   - `sort`, `unique` - Common transformations
2. **AVL Tree** - Required for efficient `unique` transducer
3. **Async transducer support** - If async sequences are needed

### Medium Priority (Common Use Cases)
1. **Pattern matching** - Useful for complex logic
2. **Caching decorators** - Performance optimization
3. **Array and number utilities** - Common helpers
4. **Trie/PrefixTree** - If search/autocomplete needed

### Lower Priority (Domain Specific)
1. **File system operations** - Only if file I/O needed
2. **Command execution** - Only if process spawning needed
3. **Money module** - Only if financial calculations needed
4. **Dates module** - Consider using existing libraries
5. **HTTP module** - Many alternatives exist

## Open Questions

1. **Async Philosophy**: Will the new implementation support async transducers, or stay sync-only?
2. **Domain Modules**: Should money/dates be separate packages or included?
3. **Node.js Integration**: Will file/process operations be added, or stay platform-agnostic?
4. **Backwards Compatibility**: Is API compatibility with old totallylazy.js a goal?
5. **Performance**: Are the missing data structures (AVL Tree, Trie) performance-critical?

## Related Research

- Original totallylazy.js repository: https://github.com/bodar/totallylazy.js
- New totallylazy in bodar.ts: https://github.com/bodar/bodar.ts/tree/master/packages/totallylazy
- Migration context: `/home/dan/Projects/bodar.ts/CLAUDE.local.md`