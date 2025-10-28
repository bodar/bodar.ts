/**
 * @module
 *
 * Base class for all SQL expressions in the template system.
 */

const NominalType = Symbol('NominalType');

/**
 * The base class for all SQL expressions.
 */
export abstract class Expression {
    /**
     * Enforce nominal typing instead of structural typing.
     */
    // @ts-ignore
    private readonly [NominalType] = this;
}
