/**
 * @module
 *
 * Error class thrown when attempting to access a non-existent element in a collection.
 */

/**
 * Error thrown when attempting to access a non-existent element in a collection
 */
export class NoSuchElement extends Error {
    constructor(message: string = 'No such element error') {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}