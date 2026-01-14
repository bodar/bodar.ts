/** Escapes SQL identifiers (table/column names) by wrapping in double quotes and escaping inner quotes. */
export function escapeIdentifier(str: string): string {
    return `"${str.replace(/"/g, '""')}"`
}

/** Escapes SQL string literals by wrapping in single quotes and escaping inner quotes. */
export function escapeLiteral(str: string): string {
    return `'${str.replace(/'/g, "''")}'`
}