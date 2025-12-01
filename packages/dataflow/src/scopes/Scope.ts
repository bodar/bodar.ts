/**
 * Represents a lexical scope in JavaScript code.
 * Tracks variable bindings and supports parent chain lookup.
 */
export class Scope {
    private readonly bindings = new Set<string>();

    constructor(
        readonly parent: Scope | null,
        readonly isFunction: boolean
    ) {}

    /**
     * Add a binding to this scope.
     * For 'var' declarations, hoists to nearest function scope.
     */
    addBinding(name: string, kind: 'var' | 'let' | 'const' | 'function' | 'class' | 'import' | 'param' | 'catch'): void {
        if (kind === 'var') {
            this.functionScope().bindings.add(name);
        } else {
            this.bindings.add(name);
        }
    }

    /**
     * Check if a name resolves to a binding in this scope or any parent.
     */
    resolves(name: string): boolean {
        if (this.bindings.has(name)) return true;
        if (this.parent) return this.parent.resolves(name);
        return false;
    }

    /**
     * Create a child scope.
     */
    child(isFunction: boolean): Scope {
        return new Scope(this, isFunction);
    }

    /**
     * Find the nearest function scope (including this one).
     */
    private functionScope(): Scope {
        if (this.isFunction) return this;
        if (this.parent) return this.parent.functionScope();
        return this; // Should never happen with proper usage
    }
}
