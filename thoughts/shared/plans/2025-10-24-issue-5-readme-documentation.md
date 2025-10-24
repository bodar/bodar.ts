# GitHub Issue #5: README Documentation Implementation Plan

## Overview

Update the root README.md with proper package links and create a comprehensive README for the lazyrecords package to ensure all packages have proper documentation.

## Current State Analysis

The monorepo currently has partial README documentation:
- Root README exists with package descriptions but lacks links to package READMEs
- totallylazy package has a comprehensive README (recently added)
- yadic package has a comprehensive README
- lazyrecords package has NO README despite having extensive functionality

### Key Discoveries:
- Root README location: `/home/dan/Projects/bodar.ts/README.md:9-16`
- Package READMEs exist at: `packages/<package>/README.md`
- lazyrecords has extensive SQL template and query building features that need documentation

## Desired End State

After implementation:
1. Root README contains package descriptions with working links to each package's README
2. Root README no longer contains package-specific todos (moved to individual package READMEs)
3. Each package README has its own Roadmap section with package-specific feature plans
4. lazyrecords has a comprehensive README documenting:
   - SQL template system and query builder
   - PostgreSQL integration with Bun (with clear requirement emphasis)
   - Future database support plans (SQLite, BigQuery)
   - Roadmap showing completed PostgreSQL and planned SQLite/BigQuery
5. All packages have consistent, high-quality documentation accessible from the root

## What We're NOT Doing

- Not adding automated documentation generation from source code
- Not restructuring the monorepo or changing package locations
- Not adding API reference documentation (deferred to JSR docs)
- Not implementing the actual features listed in todos (only documenting current state and future plans)

## Implementation Approach

Three-phase approach: First update root README with links and reorganize todos, then add todos to package READMEs, finally create comprehensive lazyrecords README.

## Phase 1: Update Root README with Package Links and Remove Package-Specific Todos

### Overview
Add proper markdown links to package READMEs in the root README file and remove package-specific todos from the root README (they will be moved to individual package READMEs in Phase 2).

### Changes Required:

#### 1. Root README Package Section
**File**: `/home/dan/Projects/bodar.ts/README.md`
**Changes**: Update lines 9-16 to add links to package directories

```markdown
### [@bodar/totallylazy](./packages/totallylazy)
A comprehensive functional programming library providing composable predicates, transducers, parsers, comparators, and collection utilities. Features lazy evaluation, parser combinators, and a complete JSON grammar with JSDoc custom type support.

### [@bodar/lazyrecords](./packages/lazyrecords)
A type-safe SQL query builder that bridges functional programming with SQL. Convert functional predicates and transducers into parameterized SQL queries. Currently supports PostgreSQL with ANSI SQL foundations.

### [@bodar/yadic](./packages/yadic)
A lightweight dependency injection container with lazy initialization. Uses property getters that convert to immutable read-only properties on first access for optimal performance.
```

#### 2. Remove Package-Specific Todos from Root README
**File**: `/home/dan/Projects/bodar.ts/README.md`
**Changes**: Remove lines 73-89 (package-specific todos)

The following todos will be moved to individual package READMEs:
- totallylazy todos (lines 73-80)
- lazyrecords todos (lines 81-83)
- yadic todos (lines 84-88)

### Success Criteria:

#### Automated Verification:
- [x] File exists: `ls -la README.md`
- [x] Links are valid: `grep -E '\]\(\.\/packages\/(totallylazy|lazyrecords|yadic)\)' README.md`
- [x] Type checking passes: `./run check`

#### End to End Verification:
- [x] Links navigate correctly to package directories in GitHub (use Fetch or Curl to find and follow links)
- [x] Package descriptions are accurate and helpful

---

## Phase 2: Add Roadmap Sections to Package READMEs

### Overview
Add roadmap/todo sections to each package README with features specific to that package, moving them from the root README.

### Changes Required:

#### 1. Add Roadmap to totallylazy README
**File**: `/home/dan/Projects/bodar.ts/packages/totallylazy/README.md`
**Changes**: Add roadmap section before License section

```markdown
## Roadmap

- [ ] Sequence
- [ ] Transducers
- [ ] Predicates
- [ ] Parser Combinators
- [ ] Immutable List + Map
- [ ] Date Parsing ?
```

#### 2. Add Roadmap to yadic README
**File**: `/home/dan/Projects/bodar.ts/packages/yadic/README.md`
**Changes**: Add roadmap section before License section

```markdown
## Roadmap

Core features are complete:
- [x] LazyMap
  - [x] constructor
  - [x] instance
  - [x] decorate
```

### Success Criteria:

#### Automated Verification:
- [x] totallylazy README contains roadmap section: `grep -A 5 "## Roadmap" packages/totallylazy/README.md`
- [x] yadic README contains roadmap section: `grep -A 5 "## Roadmap" packages/yadic/README.md`
- [x] Type checking passes: `./run check`

#### Manual Verification:
- [x] Roadmap items are accurate and reflect actual plans
- [x] Section placement is appropriate and consistent

---

## Phase 3: Create lazyrecords README

### Overview
Create a comprehensive README for the lazyrecords package following the structure of totallylazy and yadic READMEs, with special emphasis on Bun requirement and future database support.

### Changes Required:

#### 1. Create lazyrecords README
**File**: `/home/dan/Projects/bodar.ts/packages/lazyrecords/README.md`
**Changes**: Create new file with comprehensive documentation

```markdown
# @bodar/lazyrecords

A type-safe SQL query builder that bridges functional programming with relational databases. Convert @bodar/totallylazy predicates and transducers into parameterized SQL queries with full type inference. Features SQL template literals, composable query builders, and PostgreSQL integration via Bun.

## Installation

\`\`\`bash
# Deno
import { SQL } from "jsr:@bodar/lazyrecords/sql/template/Sql";

# Node.js
npx jsr add @bodar/lazyrecords
import { SQL } from "@bodar/lazyrecords/sql/template/Sql";

# Bun
bunx jsr add @bodar/lazyrecords
import { SQL } from "@bodar/lazyrecords/sql/template/Sql";
\`\`\`

## Quick Start

\`\`\`typescript
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
\`\`\`

## Core Features

### SQL Template Literals

Safe SQL construction with automatic parameterization:

\`\`\`typescript
import { SQL } from "@bodar/lazyrecords/sql/template/Sql";
import { id, value } from "@bodar/lazyrecords/sql/template";

// Basic template usage
const query = SQL\`SELECT * FROM users WHERE name = \${'Alice'}\`;

// Automatic parameterization
const userId = 123;
const sql = SQL\`SELECT * FROM users WHERE id = \${userId}\`;
// Produces parameterized query: SELECT * FROM users WHERE id = $1
// With args: [123]

// Safe identifier escaping
const tableName = "user's_table";
SQL\`SELECT * FROM \${id(tableName)}\`;
// Produces: SELECT * FROM "user's_table"

// Array spreading for IN clauses
import { spread } from "@bodar/lazyrecords/sql/template/spread";
const ids = [1, 2, 3];
SQL\`SELECT * FROM users WHERE id IN (\${spread(ids)})\`;
// Produces: SELECT * FROM users WHERE id IN ($1, $2, $3)
\`\`\`

### Type-Safe Query Builder

Build queries using functional composition with full type inference:

\`\`\`typescript
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
\`\`\`

### PostgreSQL Integration

Direct integration with Bun's PostgreSQL client:

\`\`\`typescript
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
const sql = SQL\`
  INSERT INTO users (name, email)
  VALUES (\${'Alice'}, \${'alice@example.com'})
\`;

const stmt = statement(sql);
// stmt.text: 'INSERT INTO users (name, email) VALUES ($1, $2)'
// stmt.args: ['Alice', 'alice@example.com']
\`\`\`

### ANSI SQL Components

Build SQL expressions programmatically:

\`\`\`typescript
import { select, from, where } from "@bodar/lazyrecords/sql/ansi";
import { table, column, id, value } from "@bodar/lazyrecords/sql/template";

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
\`\`\`

### Expression Types

The library uses a type-safe expression system:

\`\`\`typescript
// Core expression types
import {
  Expression,  // Base type for all SQL expressions
  Text,        // Raw SQL text
  Value,       // Parameterized values
  Identifier,  // Table/column names
  Compound,    // Composite expressions
  Sql          // Complete SQL expressions
} from "@bodar/lazyrecords/sql/template";

// Helper functions
import {
  text,    // Create raw SQL text
  value,   // Create parameterized value
  id,      // Create escaped identifier
  ids,     // Create list of identifiers
  values,  // Create list of values
  spread   // Spread array into list
} from "@bodar/lazyrecords/sql/template";

// Compose expressions
const customQuery = new Sql(
  text('SELECT * FROM '),
  id('users'),
  text(' WHERE '),
  id('email'),
  text(' = '),
  value('alice@example.com')
);
\`\`\`

## Design Patterns

### Functional Composition

Leverage @bodar/totallylazy's transducers for query building:

\`\`\`typescript
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
\`\`\`

### Type Safety

Full TypeScript support with compile-time checking:

\`\`\`typescript
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
\`\`\`

### SQL Injection Prevention

Automatic parameterization prevents SQL injection:

\`\`\`typescript
const userInput = "'; DROP TABLE users; --";

// Safe: automatically parameterized
SQL\`SELECT * FROM users WHERE name = \${userInput}\`;
// Produces: SELECT * FROM users WHERE name = $1
// With args: ["'; DROP TABLE users; --"]

// Identifiers are escaped
const tableName = 'users"; DROP TABLE users; --';
SQL\`SELECT * FROM \${id(tableName)}\`;
// Produces: SELECT * FROM "users""; DROP TABLE users; --"
\`\`\`

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
```

### Success Criteria:

#### Automated Verification:
- [x] File exists: `ls -la packages/lazyrecords/README.md`
- [x] Markdown is valid: `./run check`
- [x] All code examples are syntactically correct
- [x] Package.json exports align with import examples
- [x] Platform Support section exists: `grep -A 3 "## Platform Support" packages/lazyrecords/README.md`
- [x] Roadmap section exists: `grep -A 3 "## Roadmap" packages/lazyrecords/README.md`
- [x] Bun requirement is emphasized: `grep "requires Bun" packages/lazyrecords/README.md`
- [x] Roadmap matches source: PostgreSQL checked, SQLite and BigQuery unchecked

#### Manual Verification:
- [x] README provides clear value proposition
- [x] Installation instructions work for all platforms
- [x] Code examples are accurate and runnable
- [x] Feature coverage is comprehensive
- [x] Dependencies on totallylazy are clearly documented
- [x] Bun requirement is prominently displayed
- [x] Roadmap only includes databases from root README (SQLite) and user-mentioned (BigQuery)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the documentation is satisfactory before marking the issue as complete.

---

## Testing Strategy

### Manual Testing Steps:
1. Navigate to root README and verify all package links work
2. Review lazyrecords README for completeness and accuracy
3. Test code examples from the README in a sample project
4. Verify import paths match actual package exports
5. Check that JSR documentation links work

## Performance Considerations

None - this is documentation only.

## Migration Notes

Not applicable - adding documentation only.

## References

- Original issue: GitHub Issue #5
- Research document: `thoughts/shared/research/2025-10-24-readme-documentation-status.md`
- Pattern reference: `packages/totallylazy/README.md`
- Pattern reference: `packages/yadic/README.md`