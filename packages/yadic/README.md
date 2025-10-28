# @bodar/yadic
[![JSR Score](https://jsr.io/badges/@bodar/yadic/score)](https://jsr.io/@bodar/yadic)

A super small and lightning fast dependency injection container with lazy initialization. Uses lazy properties that once called are automatically converted into regular read-only properties for ultimate speed and reliability in constructing graphs of objects.

## Installation

```bash
# Deno
import { LazyMap } from "jsr:@bodar/yadic/LazyMap";

# Node.js
npx jsr add @bodar/yadic
import { LazyMap } from "@bodar/yadic/LazyMap";

# Bun
bunx jsr add @bodar/yadic
import { LazyMap } from "@bodar/yadic/LazyMap";
```

## Quick Start

```typescript
import { LazyMap, instance, constructor } from "@bodar/yadic/LazyMap";

// Create a dependency container
const container = LazyMap.create()
  .set('apiUrl', instance('https://api.example.com'))
  .set('timeout', instance(5000))
  .set('client', constructor(HttpClient));

// Dependencies are initialized lazily on first access
const client = container.client; // HttpClient is instantiated here
```

## Core Features

### Lazy Initialization

Dependencies are only computed on first access and then cached:

```typescript
import { LazyMap } from "@bodar/yadic/LazyMap";

let callCount = 0;
const map = LazyMap.create()
  .set('value', () => {
    callCount++;
    return 'expensive computation';
  });

console.log(callCount); // 0 - not called yet
console.log(map.value); // 'expensive computation'
console.log(callCount); // 1 - called once
console.log(map.value); // 'expensive computation' (cached)
console.log(callCount); // 1 - still only called once
```

### Type-Safe Dependencies

The container tracks all registered dependencies in the type system:

```typescript
import { LazyMap, instance } from "@bodar/yadic/LazyMap";

const map = LazyMap.create()
  .set('port', instance(8080))
  .set('host', instance('localhost'))
  .set('url', (deps) => `http://${deps.host}:${deps.port}`);

// TypeScript knows about all dependencies
const url: string = map.url; // Type-safe access
```

### Constructor Injection

Automatically inject dependencies into class constructors:

```typescript
import { LazyMap, constructor, instance } from "@bodar/yadic/LazyMap";
import type { Dependency } from "@bodar/yadic/types";

class Database {
  constructor(deps: Dependency<'connectionString', string>) {
    this.connect(deps.connectionString);
  }
}

const container = LazyMap.create()
  .set('connectionString', instance('postgres://localhost'))
  .set('db', constructor(Database));

const db = container.db; // Database instance with injected connection string
```

### Helper Functions

#### instance()
Wraps a constant value as a dependency:

```typescript
import { LazyMap, instance } from "@bodar/yadic/LazyMap";

const map = LazyMap.create()
  .set('config', instance({ debug: true, port: 3000 }));
```

#### alias()
Creates an alias to another dependency:

```typescript
import { LazyMap, instance, alias } from "@bodar/yadic/LazyMap";

const map = LazyMap.create()
  .set('primaryDb', instance(new Database()))
  .set('db', alias('primaryDb')); // db points to primaryDb
```

#### constructor()
Wraps a constructor function for automatic instantiation:

```typescript
import { LazyMap, constructor } from "@bodar/yadic/LazyMap";

class Service {}

const map = LazyMap.create()
  .set('service', constructor(Service));
```

### Decoration Pattern

Wrap existing dependencies with additional functionality:

```typescript
import { LazyMap, constructor } from "@bodar/yadic/LazyMap";

class Logger {
  log(msg: string) { console.log(msg); }
}

class TimestampLogger {
  constructor(deps: Dependency<'logger', Logger>) {
    this.logger = deps.logger;
  }
  log(msg: string) {
    this.logger.log(`[${new Date().toISOString()}] ${msg}`);
  }
}

const map = LazyMap.create()
  .set('logger', constructor(Logger))
  .decorate('logger', constructor(TimestampLogger));

map.logger.log('Hello'); // Outputs with timestamp
```

### Parent-Child Containers

Create child containers that inherit from parent:

```typescript
import { LazyMap, instance } from "@bodar/yadic/LazyMap";

const parent = LazyMap.create()
  .set('apiUrl', instance('https://api.example.com'));

const child = LazyMap.create(parent)
  .set('endpoint', (deps) => `${deps.apiUrl}/users`);

console.log(child.endpoint); // 'https://api.example.com/users'
```

### Object Chaining

Merge multiple objects with precedence (earlier objects override later ones):
(The preserves lazyness unlike spreading which would cause all lazy properties to be realised)

```typescript
import { chain } from "@bodar/yadic/chain";

const defaults = { timeout: 5000, retries: 3 };
const overrides = { timeout: 10000 };

const config = chain(overrides, defaults);
console.log(config.timeout); // 10000 (from overrides)
console.log(config.retries); // 3 (from defaults)
```

## Roadmap

Core features are complete:
- [x] LazyMap
  - [x] constructor
  - [x] instance
  - [x] decorate

## API Reference

See the [JSR documentation](https://jsr.io/@bodar/yadic) for complete API details.

## License

Apache-2.0
