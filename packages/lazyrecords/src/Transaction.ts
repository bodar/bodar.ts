/**
 * @module
 *
 * SQL Transaction implementation.
 */

/**
 * Transaction interface for managing database transaction lifecycle.
 * Independent of Connection - controls begin/commit/rollback only.
 */
export interface Transaction {
    /**
     * Begins the transaction.
     */
    begin(): Promise<void>;

    /**
     * Commits the transaction, persisting all changes.
     */
    commit(): Promise<void>;

    /**
     * Rolls back the transaction, discarding all changes.
     */
    rollback(): Promise<void>;
}

