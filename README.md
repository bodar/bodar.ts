# bodar.ts
[![bodar](https://circleci.com/gh/bodar/bodar.ts.svg?style=shield)](https://app.circleci.com/pipelines/github/bodar/bodar.ts)
[![codecov](https://codecov.io/gh/bodar/bodar.ts/graph/badge.svg?token=USVRV8KZ4R)](https://codecov.io/gh/bodar/bodar.ts)

The project is a monorepo which contains a few packages:
- totallylazy - a library for functional programming in TypeScript
- lazyrecords - a library for accessing databases in a functional way (currently SQL only)
- yadic - a library for building objects and their dependencies lazily in TypeScript

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

* totallylazy
  * [ ] Sequence
  * [ ] Transducers
  * [ ] Predicates
  * [ ] Parser Combinators
  * [ ] Immutable List + Map
  * [ ] Date Parsing ?
  * [ ] ...
* lazyrecord
  * [ ] Postgres
  * [ ] SQLite
* yadic
  * [x] LazyMap
    * [x] constructor
    * [x] instance
    * [x] decorate
* utterlyidle / http4d
