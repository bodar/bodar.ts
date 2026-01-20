# @bodar/lazyrecords-duckdb

DuckDB native adapter for lazyrecords using `@duckdb/node-api`.

## Installation

```bash
bunx jsr add @bodar/lazyrecords-duckdb
```

## Usage

```typescript
import { DuckDBInstance } from "@duckdb/node-api";
import { DuckDBConnection } from "@bodar/lazyrecords-duckdb/DuckDBConnection.ts";
import { DuckDBRecords } from "@bodar/lazyrecords-duckdb/DuckDBRecords.ts";
import { duckdbTransaction } from "@bodar/lazyrecords-duckdb/DuckDBTransaction.ts";
import { SqlSchema } from "@bodar/lazyrecords/sql/SqlSchema.ts";
import { duckdbMappings } from "@bodar/lazyrecords-duckdb/duckdbMappings.ts";
import { definition, keyword } from "@bodar/lazyrecords";

// Define your schema
interface User {
  id: number;
  name: string;
}

const userId = keyword<User, 'id'>('id', Number);
const userName = keyword<User, 'name'>('name', String);
const users = definition<User>('users', [userId, userName]);

// Create connection
const instance = await DuckDBInstance.create(':memory:');
const native = await instance.connect();
const connection = new DuckDBConnection(native);
const records = new DuckDBRecords(connection);
const schema = new SqlSchema(connection, duckdbMappings());
const transaction = duckdbTransaction(connection);

// Use the records API
await transaction.begin();
await schema.define(users);
await records.add(users, [{ id: 1, name: 'Alice' }]);

for await (const user of records.get(users)) {
  console.log(user.name); // "Alice"
}

await transaction.commit();
```
