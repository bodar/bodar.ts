# @bodar/lazyrecords
[![JSR Score](https://jsr.io/badges/@bodar/lazyrecords/score)](https://jsr.io/@bodar/lazyrecords)

A type-safe SQL query builder that bridges functional programming with relational databases. Convert @bodar/totallylazy predicates and transducers into parameterized SQL queries with full type inference. Features SQL template literals, composable query builders, and PostgreSQL integration via Bun.

## Installation

```bash
# Deno
import { SQL } from "jsr:@bodar/lazyrecords/sql/template/Sql";

# Node.js
npx jsr add @bodar/lazyrecords
import { SQL } from "@bodar/lazyrecords/sql/template/Sql";

# Bun
bunx jsr add @bodar/lazyrecords
import { SQL } from "@bodar/lazyrecords/sql/template/Sql";
```

## Quick Start

```typescript
import { SQL } from "@bodar/lazyrecords/sql/template/Sql";
import { PostgresRecords } from "@bodar/lazyrecords/sql/postgres/PostgresRecords";
import { definition } from "@bodar/lazyrecords/sql/builder/builders";
import { filter, map } from "@bodar/totallylazy/transducers";
import { where, is } from "@bodar/totallylazy/predicates";
import { property, select } from "@bodar/totallylazy/functions";

// Define your schema
interface User {
  id: number;
  name: string;
  email: string;
}

// Create type-safe queries
const users = definition<User>("users");
const name = property<User, 'name'>('name');

// Build queries functionally
const records = new PostgresRecords(client);
const results = await records.get(users,
  filter(where(name, is('Alice'))),
  map(select('id', 'name'))
);
```

## Core Features

### SQL Template Literals

Safe SQL construction with automatic parameterization:

```typescript
import { SQL } from "@bodar/lazyrecords/sql/template/Sql";
import { id, value } from "@bodar/lazyrecords/sql/template/mod";

// Basic template usage
const query = SQL`SELECT * FROM users WHERE name = ${'Alice'}`;

// Automatic parameterization
const userId = 123;
const sql = SQL`SELECT * FROM users WHERE id = ${userId}`;
// Produces parameterized query: SELECT * FROM users WHERE id = $1
// With args: [123]

// Safe identifier escaping
const tableName = "user's_table";
SQL`SELECT * FROM ${id(tableName)}`;
// Produces: SELECT * FROM "user's_table"

// Array spreading for IN clauses
import { spread } from "@bodar/lazyrecords/sql/template/mod";
const ids = [1, 2, 3];
SQL`SELECT * FROM users WHERE id IN (${spread(ids)})`;
// Produces: SELECT * FROM users WHERE id IN ($1, $2, $3)
```

### Type-Safe Query Builder

Build queries using functional composition with full type inference:

```typescript
import { definition, toSelect } from "@bodar/lazyrecords/sql/builder/builders";
import { filter, map } from "@bodar/totallylazy/transducers";
import { where, is, and, or, not, between } from "@bodar/totallylazy/predicates";
import { property, select } from "@bodar/totallylazy/functions";

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

const products = definition<Product>("products");
const price = property<Product, 'price'>('price');
const category = property<Product, 'category'>('category');

// Simple select all
toSelect(products);
// Generates: SELECT * FROM "products"

// Filter with WHERE clause
toSelect(products,
  filter(where(category, is('Electronics')))
);
// Generates: SELECT * FROM "products" WHERE "category" = 'Electronics'

// Select specific columns
toSelect(products,
  map(select('id', 'name', 'price'))
);
// Generates: SELECT "id", "name", "price" FROM "products"

// Complex predicates
toSelect(products,
  filter(and(
    where(category, is('Electronics')),
    where(price, between(100, 500))
  ))
);
// Generates: WHERE ("category" = 'Electronics' AND "price" BETWEEN 100 AND 500)

// Multiple filters (implicit AND)
toSelect(products,
  filter(where(category, is('Electronics'))),
  filter(where(price, between(100, 500)))
);

// OR conditions
toSelect(products,
  filter(or(
    where(category, is('Electronics')),
    where(category, is('Computers'))
  ))
);

// NOT predicate
toSelect(products,
  filter(not(where(category, is('Discontinued'))))
);
// Generates: WHERE NOT ("category" = 'Discontinued')
```

### PostgreSQL Integration

Direct integration with Bun's PostgreSQL client:

```typescript
import { SQL } from "bun:sql";
import { PostgresRecords } from "@bodar/lazyrecords/sql/postgres/PostgresRecords";
import { statement } from "@bodar/lazyrecords/sql/postgres/statement";

// Initialize client
const client = new SQL({
  hostname: "localhost",
  port: 5432,
  database: "mydb",
  username: "user",
  password: "pass"
});

const records = new PostgresRecords(client);

// Type-safe queries with automatic parameterization
const users = definition<User>("users");
const email = property<User, 'email'>('email');

// Async iteration (streaming)
const query = records.query(users,
  filter(where(email, is('alice@example.com')))
);

for await (const user of query) {
  console.log(user);
}

// Promise-based (load all)
const results = await records.get(users,
  filter(where(email, is('alice@example.com')))
);

// Manual SQL with prepared statements
const sql = SQL`
  INSERT INTO users (name, email)
  VALUES (${'Alice'}, ${'alice@example.com'})
`;

const stmt = statement(sql);
// stmt.text: 'INSERT INTO users (name, email) VALUES ($1, $2)'
// stmt.args: ['Alice', 'alice@example.com']
```

### ANSI SQL Components

Build SQL expressions programmatically:

```typescript
import { select } from "@bodar/lazyrecords/sql/ansi/SelectExpression";
import { from } from "@bodar/lazyrecords/sql/ansi/FromClause";
import { where } from "@bodar/lazyrecords/sql/ansi/WhereClause";
import { table } from "@bodar/lazyrecords/sql/ansi/Table";
import { column } from "@bodar/lazyrecords/sql/ansi/Column";
import { id, value } from "@bodar/lazyrecords/sql/template/mod";

// Build SELECT expression
const query = select(
  column('name'),
  column('email')
).from(table('users'))
 .where(column('active').eq(value(true)));

// Table and column aliases
const u = table('users').as('u');
const userName = column('name').as('userName');

select(userName)
  .from(u)
  .where(column('u.id').eq(value(123)));
// Generates: SELECT "name" AS "userName" FROM "users" AS "u" WHERE "u"."id" = 123
```

### Expression Types

The library uses a type-safe expression system:

```typescript
// Core expression types
import {
  Expression,  // Base type for all SQL expressions
  Text,        // Raw SQL text
  Value,       // Parameterized values
  Identifier,  // Table/column names
  Compound,    // Composite expressions
  Sql          // Complete SQL expressions
} from "@bodar/lazyrecords/sql/template/mod";

// Helper functions
import {
  text,    // Create raw SQL text
  value,   // Create parameterized value
  id,      // Create escaped identifier
  ids,     // Create list of identifiers
  values,  // Create list of values
  spread   // Spread array into list
} from "@bodar/lazyrecords/sql/template/mod";

// Compose expressions
const customQuery = new Sql(
  text('SELECT * FROM '),
  id('users'),
  text(' WHERE '),
  id('email'),
  text(' = '),
  value('alice@example.com')
);
```

## Design Patterns

### Functional Composition

Leverage @bodar/totallylazy's transducers for query building:

```typescript
// Queries compose left-to-right
const baseQuery = [
  filter(where(active, is(true)))
];

const withCategory = [
  ...baseQuery,
  filter(where(category, is('Electronics')))
];

const withPriceRange = [
  ...withCategory,
  filter(where(price, between(100, 500)))
];

const finalQuery = toSelect(products, ...withPriceRange);
```

### Type Safety

Full TypeScript support with compile-time checking:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const users = definition<User>("users");

// Type error: 'invalid' doesn't exist on User
// filter(where(property<User, 'invalid'>('invalid'), is('test')))

// Type safe: property exists and types match
filter(where(property<User, 'email'>('email'), is('alice@example.com')))
```

### SQL Injection Prevention

Automatic parameterization prevents SQL injection:

```typescript
const userInput = "'; DROP TABLE users; --";

// Safe: automatically parameterized
SQL`SELECT * FROM users WHERE name = ${userInput}`;
// Produces: SELECT * FROM users WHERE name = $1
// With args: ["'; DROP TABLE users; --"]

// Identifiers are escaped
const tableName = 'users"; DROP TABLE users; --';
SQL`SELECT * FROM ${id(tableName)}`;
// Produces: SELECT * FROM "users""; DROP TABLE users; --"
```

## Dependencies

This package depends on [@bodar/totallylazy](../totallylazy) for:
- Transducers (filter, map)
- Predicates (where, is, and, or, not, between)
- Functions (property, select)

## Platform Support

**Important**: This package currently **requires Bun runtime** for PostgreSQL integration via the native `bun:sql` module. The PostgreSQL adapter is not compatible with Node.js or Deno at this time.

The SQL template system and query builder work with any runtime and can be extended to support additional databases.

## Roadmap

- [x] PostgreSQL (via Bun)
- [ ] SQLite
- [ ] BigQuery

## API Reference

See the [JSR documentation](https://jsr.io/@bodar/lazyrecords) for complete API details.

## License

Apache-2.0
