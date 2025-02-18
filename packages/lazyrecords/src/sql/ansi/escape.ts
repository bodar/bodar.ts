export function escapeIdentifier(str: string): string {
    return `"${str.replace(/"/g, '""')}"`
}

export function escapeLiteral(str: string): string {
    return `'${str.replace(/'/g, "''")}'`
}