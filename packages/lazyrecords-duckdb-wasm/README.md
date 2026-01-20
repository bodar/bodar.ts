# @bodar/lazyrecords-duckdb-wasm

DuckDB WASM adapter for lazyrecords using `@duckdb/duckdb-wasm`.

## Installation

```bash
bunx jsr add @bodar/lazyrecords-duckdb-wasm
```

## Usage

```typescript
import { createDuckDB, DuckDBWasmConnection } from "@bodar/lazyrecords-duckdb-wasm/DuckDBWasmConnection.ts";
import { DuckDBWasmRecords } from "@bodar/lazyrecords-duckdb-wasm/DuckDBWasmRecords.ts";
import { duckdbWasmTransaction } from "@bodar/lazyrecords-duckdb-wasm/DuckDBWasmTransaction.ts";
import { SqlSchema } from "@bodar/lazyrecords/sql/SqlSchema.ts";
import { duckdbMappings } from "@bodar/lazyrecords-duckdb-wasm/duckdbMappings.ts";
import { definition, keyword } from "@bodar/lazyrecords";

// Define your schema
interface User {
  id: number;
  name: string;
}

const userId = keyword<User, 'id'>('id', Number);
const userName = keyword<User, 'name'>('name', String);
const users = definition<User>('users', [userId, userName]);

// Create WASM connection
const { db, conn } = await createDuckDB();
const connection = new DuckDBWasmConnection(conn);
const records = new DuckDBWasmRecords(connection);
const schema = new SqlSchema(connection, duckdbMappings());
const transaction = duckdbWasmTransaction(connection);

// Use the records API
await transaction.begin();
await schema.define(users);
await records.add(users, [{ id: 1, name: 'Alice' }]);

for await (const user of records.get(users)) {
  console.log(user.name); // "Alice"
}

await transaction.commit();
```

## Blocking Connection

For synchronous usage, use the blocking connection:

```typescript
import { createDuckDBWasmBlocking, DuckDBWasmBlockingConnection } from "@bodar/lazyrecords-duckdb-wasm/DuckDBWasmBlockingConnection.ts";

const db = await createDuckDBWasmBlocking();
const conn = db.connect();
const connection = new DuckDBWasmBlockingConnection(conn);
// ... use connection
conn.close();
```
