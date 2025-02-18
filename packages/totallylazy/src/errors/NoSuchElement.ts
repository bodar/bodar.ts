export class NoSuchElement extends Error {
    constructor(message: string = 'No such element error') {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}