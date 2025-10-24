/**
 * TypeScript type definitions for the yadic dependency injection system.
 *
 * Provides type-safe interfaces and utilities for defining dependencies,
 * constructors, and dependency-aware classes.
 *
 * @module
 *
 * @example
 * ```ts
 * import type { Dependency, AutoConstructor } from "@bodar/yadic/types";
 *
 * // Define a dependency
 * type DbDep = Dependency<'connectionString', string>;
 *
 * // Use in a constructor
 * class Database {
 *   constructor(deps: DbDep) {
 *     this.connect(deps.connectionString);
 *   }
 * }
 * ```
 */

/**
 * Represents a readonly dependency with a specific key and value type.
 *
 * Creates a mapped type with a single readonly property. Used to define
 * the shape of dependencies that classes can require in their constructors.
 *
 * @template K - Property key (dependency name)
 * @template V - Property value type
 *
 * @example
 * ```ts
 * type DbDependency = Dependency<'connectionString', string>;
 * // Equivalent to: { readonly connectionString: string }
 *
 * class Database {
 *   constructor(deps: DbDependency) {
 *     this.connect(deps.connectionString);
 *   }
 * }
 * ```
 */
export type Dependency<K extends PropertyKey, V> = {
    readonly [P in K]: V;
}

/**
 * Interface for constructors that accept a dependency object.
 *
 * Defines the signature for class constructors that use dependency injection.
 * The constructor receives an object with all required dependencies and
 * returns an instance of the target type.
 *
 * @template D - Dependencies object type
 * @template T - Instance type returned by constructor
 *
 * @example
 * ```ts
 * type ServiceDeps = Dependency<'logger', Logger> & Dependency<'config', Config>;
 *
 * const ServiceConstructor: AutoConstructor<ServiceDeps, Service> = class Service {
 *   constructor(deps: ServiceDeps) {
 *     this.logger = deps.logger;
 *     this.config = deps.config;
 *   }
 * };
 * ```
 */
export interface AutoConstructor<D, T> {
    new(deps: D): T
}

/**
 * Interface for constructors with no arguments.
 *
 * Defines the signature for zero-argument class constructors that don't
 * require dependency injection. Used by the constructor() helper to
 * differentiate between constructors with and without dependencies.
 *
 * @template T - Instance type returned by constructor
 *
 * @example
 * ```ts
 * const SimpleConstructor: Constructor<Logger> = class Logger {
 *   constructor() {
 *     this.startTime = Date.now();
 *   }
 * };
 * ```
 */
export interface Constructor<T> {
    new(): T
}
