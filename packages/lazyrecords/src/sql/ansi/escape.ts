/**
 * @module
 *
 * ANSI SQL identifier and literal escaping functions for safe SQL generation.
 */

export function escapeIdentifier(str: string): string {
    return `"${str.replace(/"/g, '""')}"`
}

export function escapeLiteral(str: string): string {
    return `'${str.replace(/'/g, "''")}'`
}