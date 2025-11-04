# @bodar/totallylazy
[![JSR Score](https://jsr.io/badges/@bodar/totallylazy/score)](https://jsr.io/@bodar/totallylazy)

A comprehensive functional programming library for TypeScript providing composable predicates, transducers, parsers, comparators, and collection utilities. Features lazy evaluation, type safety, and self-describing APIs for ultimate developer experience.

## Installation

```bash
# Deno
import { sequence } from "jsr:@bodar/totallylazy/collections/Sequence";

# Node.js
npx jsr add @bodar/totallylazy
import { sequence } from "@bodar/totallylazy/collections/Sequence";

# Bun
bunx jsr add @bodar/totallylazy
import { sequence } from "@bodar/totallylazy/collections/Sequence";
```

## Quick Start

```typescript
import { sequence } from "@bodar/totallylazy/collections/Sequence";
import { filter } from "@bodar/totallylazy/transducers/FilterTransducer";
import { map } from "@bodar/totallylazy/transducers/MapTransducer";

// Compose lazy transformations
const numbers = [1, 2, 3, 4, 5];
const result = sequence(numbers,
  filter(n => n % 2 === 0),
  map(n => n * 2)
);

console.log(Array.from(result)); // [4, 8]
```

## Core Features

### Predicates

Composable boolean test functions that are type-safe and self-describing:

```typescript
import { where } from "@bodar/totallylazy/predicates/WherePredicate";
import { property } from "@bodar/totallylazy/functions/Property";
import { is } from "@bodar/totallylazy/predicates/IsPredicate";
import { equals } from "@bodar/totallylazy/predicates/EqualsPredicate";
import { and, or, not } from "@bodar/totallylazy/predicates";

interface Car {
  make: string;
  colour: string;
  year: number;
}

const colour = property<Car, 'colour'>('colour');
const year = property<Car, 'year'>('year');

const cars: Car[] = [
  { make: 'Ford', colour: 'Red', year: 2020 },
  { make: 'Toyota', colour: 'Blue', year: 2022 },
];

// Type-safe property-based predicates
cars.filter(where(colour, is('Red')));

// Deep equality checking
cars.filter(where(colour, equals('Red')));

// Logical composition
cars.filter(and(
  where(colour, is('Red')),
  where(year, equals(2020))
));

// Negation
cars.filter(not(where(colour, is('Red'))));

// Self-describing for debugging
const predicate = where(colour, is('Red'));
console.log(predicate.toString()); // "where(property('colour'), is("Red"))"
```

**Available Predicates:**
- `is()` - Object.is equality
- `equals()` - Deep equality
- `where()` - Property-based predicates
- `and()`, `or()`, `not()` - Logical operators
- `between()` - Range checks
- `among()` - Character set membership

### Transducers

Lazy, composable transformations for iterables with automatic flattening:

```typescript
import { sequence } from "@bodar/totallylazy/collections/Sequence";
import { map } from "@bodar/totallylazy/transducers/MapTransducer";
import { filter, accept, reject } from "@bodar/totallylazy/transducers/FilterTransducer";
import { flatMap } from "@bodar/totallylazy/transducers/FlatMapTransducer";

const numbers = [1, 2, 3, 4, 5];

// Chain multiple transformations
const result = sequence(numbers,
  filter(n => n > 2),
  map(n => n * 2),
  map(String)
);

// Only evaluated when iterated
for (const value of result) {
  console.log(value); // '6', '8', '10'
}

// Flatten nested iterables
const nested = sequence([1, 2, 3],
  flatMap(n => [n, n * 10])
);
Array.from(nested); // [1, 10, 2, 20, 3, 30]

// Use accept/reject as filter aliases
const evens = sequence(numbers, accept(n => n % 2 === 0));
const odds = sequence(numbers, reject(n => n % 2 === 0));
```

**Key Features:**
- Lazy evaluation - only processes what you iterate
- Automatic composition and flattening
- Inspectable transducer chains
- Type-safe transformations

### Parser Combinators

Build composable parsers with powerful combinators:

```typescript
import { parser } from "@bodar/totallylazy/parsers/Parser";
import { string } from "@bodar/totallylazy/parsers/StringParser";
import { regex } from "@bodar/totallylazy/parsers/RegexParser";
import { view } from "@bodar/totallylazy/parsers/View";
import { map } from "@bodar/totallylazy/transducers/MapTransducer";
import {
  then, between, many, many1,
  atLeast, atMost, times
} from "@bodar/totallylazy/parsers/parsers";

// Parse and transform
const number = parser(regex(/\d+/), map(Number));
const result = number.parse(view('123 USD'));
// result.value = 123, result.remainder = ' USD'

// Compose parsers
const amount = parser(
  regex(/\d+/),
  map(Number),
  then(parser(string('USD'), precededBy(string(' '))))
);
amount.parse(view('123 USD')).value; // [123, 'USD']

// Parse between delimiters
const inParens = parser(
  regex(/\d+/),
  map(Number),
  between(string('('), string(')'))
);
inParens.parse(view('(123)')).value; // 123

// Repetition
many(string('A')).parse(view('AAABBB')).value; // ['A', 'A', 'A']
many1(string('A')).parse(view('AAABBB')).value; // ['A', 'A', 'A'] (at least 1)
atLeast(2)(string('A')).parse(view('AAA')).value; // ['A', 'A', 'A']
atMost(2)(string('A')).parse(view('AAA')).value; // ['A', 'A']
times(3)(string('A')).parse(view('AAA')).value; // ['A', 'A', 'A']
```

**Parser Combinators:**
- `then()`, `next()`, `followedBy()` - Sequential composition
- `between()`, `surroundedBy()` - Delimited parsing
- `many()`, `many1()` - Repetition (0+ and 1+)
- `atLeast()`, `atMost()`, `times()` - Counted repetition
- `separatedBy()` - List parsing with separators

### JSON Grammar

Complete JSON parser with extensions:

```typescript
import { Json } from "@bodar/totallylazy/grammars/Json";
import { view } from "@bodar/totallylazy/parsers/View";

// Parse primitives
Json.null.parse(view('null')).value; // null
Json.boolean.parse(view('true')).value; // true
Json.number.parse(view('12.1')).value; // 12.1
Json.string.parse(view('"Hello"')).value; // 'Hello'

// Parse complex structures
Json.array.parse(view('["foo", 123]')).value; // ['foo', 123]
Json.object.parse(view('{"key": "value"}')).value; // {key: 'value'}

// Handles whitespace and comments
Json.value().parse(view('// Comment\n["cats", "dogs"]')).value;
// ['cats', 'dogs']

// Custom types via JSDoc annotations
const map = Json.custom().parse(
  view('/** @type {Map} */ [["key", "value"]]')
).value;
// map instanceof Map === true
// map.get('key') === 'value'

const date = Json.value().parse(
  view('/** @type {Date} */ "2023-12-13T06:45:12.218Z"')
).value;
// date instanceof Date === true
```

### Comparators

Composable sorting functions with property-based comparison:

```typescript
import { by } from "@bodar/totallylazy/comparators/by";
import { ascending, descending } from "@bodar/totallylazy/comparators";
import { property } from "@bodar/totallylazy/functions/Property";
import { comparators } from "@bodar/totallylazy/comparators/comparators";

interface Person {
  name: string;
  age: number;
}

const people: Person[] = [
  { name: 'Bob', age: 30 },
  { name: 'Alice', age: 25 },
];

const name = property<Person, 'name'>('name');
const age = property<Person, 'age'>('age');

// Sort by property
people.sort(by(name, ascending));
people.sort(by('name', descending)); // Using key string
people.sort(by(p => p.name, ascending)); // Using function

// Combine multiple comparators
people.sort(comparators(
  by(age, ascending),
  by(name, ascending)
));
```

### Collections

#### Sequence
Lazy collection with composable transducers:

```typescript
import { sequence } from "@bodar/totallylazy/collections/Sequence";
import { iterate, repeat } from "@bodar/totallylazy/collections/Sequence";
import { filter, map } from "@bodar/totallylazy/transducers";

// Basic sequence
const seq = sequence([1, 2, 3, 4],
  filter(n => n % 2 === 0),
  map(n => n * 2)
);

// Infinite sequences
const naturals = iterate(1, n => n + 1);
const randoms = repeat(() => Math.random());

// Sequences automatically flatten when nested
const nested = sequence(seq, filter(n => n > 4));
// Transducers are flattened into single chain
```

#### Single Value Extraction

```typescript
import { single } from "@bodar/totallylazy/collections/Single";

const result = single([1, 2, 3], filter(n => n === 2));
// result === 2

// Throws if empty or multiple values
```

### Functions

#### Curry

Type-safe function currying with introspection and advanced features:

```typescript
import { curry, _ } from "@bodar/totallylazy/functions/curry";

// Basic currying
const add = (a: number, b: number) => a + b;
const curriedAdd = curry(add);

curriedAdd(1, 2); // 3
curriedAdd(1)(2); // 3

// Introspection - applied arguments as properties
const partial = curriedAdd(1);
partial.a; // 1
partial.toString(); // "add(1)"

// Placeholder support
const greet = curry((first: string, last: string) => `Hello ${first} ${last}`);
greet(_, 'Bodart')('Dan'); // "Hello Dan Bodart"

// Default parameters (works unlike Ramda)
const multiply = curry((a: number, b: number = 2) => a * b);
multiply(3); // 6
multiply(3, 3); // 9

// Rest parameters
const sum = curry((a: number, b: number, ...rest: number[]) =>
  [a, b, ...rest].reduce((sum, n) => sum + n, 0)
);
sum(1, 2, 3, 4, 5); // 15
sum(1)(2, 3, 4); // 10
```

**Comparison to Ramda:**

totallylazy's curry offers several advantages:

| Feature | totallylazy | Ramda |
|---------|-------------|-------|
| **Default parameters** | ✅ Full support | ❌ Breaks (documented limitation) |
| **Rest parameters** | ✅ Full support | ✅ Via extra args |
| **Introspection** | ✅ Via properties | ❌ Not available |
| **toString()** | ✅ Shows applied args | ❌ Standard toString |
| **Type safety** | ✅ Full TypeScript | ⚠️ Basic types |
| **Placeholder** | ✅ `_` placeholder symbol | ✅ `R.__` placeholder object |
| **Implementation** | Proxy-based | Recursive wrapping |

**Runtime flexibility:** Like native JavaScript, curried functions forward all arguments at runtime while TypeScript enforces type safety at compile-time.

#### Deep Equality

```typescript
import { equal } from "@bodar/totallylazy/functions/equal";

equal(1, 1); // true
equal([1, 2], [1, 2]); // true (deep)
equal({ a: 1 }, { a: 1 }); // true (deep)
equal(new Map([[1, 2]]), new Map([[1, 2]])); // true
equal(NaN, NaN); // true (handles special cases)
```

#### Lazy Evaluation

```typescript
import { lazy } from "@bodar/totallylazy/functions/lazy";

// As function wrapper
const expensive = lazy(() => {
  console.log('Computing...');
  return 42;
});

expensive(); // Logs 'Computing...', returns 42
expensive(); // Returns 42 (cached, no log)

// As decorator
class Example {
  @lazy
  get computed() {
    console.log('Computing...');
    return 42;
  }
}
```

### Asserts

```typescript
import { assertThat, assertTrue, assertFalse } from "@bodar/totallylazy/asserts";
import { equals, is } from "@bodar/totallylazy/predicates";

assertThat(42, equals(42)); // Passes
assertThat('test', is('test')); // Passes
assertTrue(true); // Passes
assertFalse(false); // Passes

assertThat(42, equals(99)); // Throws Error
```

## Design Patterns

### Self-Describing APIs
All predicates, transducers, and comparators implement `toString()` for debugging:

```typescript
const predicate = where(property('age'), equals(30));
console.log(predicate.toString());
// "where(property('age'), equals(30))"
```

### Lazy Evaluation
Sequences and transducers only compute values when iterated:

```typescript
const seq = sequence([1, 2, 3, 4, 5],
  map(n => {
    console.log('Processing:', n);
    return n * 2;
  })
);
// Nothing logged yet

Array.from(seq); // Now logs and processes
```

### Type Safety
Full TypeScript support with type inference throughout:

```typescript
const seq = sequence([1, 2, 3],
  filter(n => n > 1),  // n: number
  map(String)          // returns Sequence<string>
);
// seq is Sequence<string>
```

## Roadmap

Core features implemented:
- [x] Sequence
- [x] Transducers
- [x] Predicates
- [x] Parser Combinators
- [x] Comparators
- [x] JSON Grammar
- [x] Functions (curry, lazy, equal, property, select)
- [x] Asserts

Future enhancements:
- [ ] Immutable List + Map
- [ ] Date Parsing

## API Reference

See the [JSR documentation](https://jsr.io/@bodar/totallylazy) for complete API details.

## License

Apache-2.0
