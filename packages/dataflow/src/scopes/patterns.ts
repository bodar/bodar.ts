import type {Node} from "acorn";

/**
 * Extract all binding names from a pattern (handles destructuring)
 */
export function extractBindings(pattern: Node | null): string[] {
    if (!pattern) return [];

    switch (pattern.type) {
        case "Identifier":
            return [(pattern as any).name];

        case "ObjectPattern":
            return (pattern as any).properties.flatMap((prop: any) => {
                if (prop.type === "RestElement") {
                    return extractBindings(prop.argument);
                }
                return extractBindings(prop.value);
            });

        case "ArrayPattern":
            return (pattern as any).elements.flatMap((el: any) => extractBindings(el));

        case "RestElement":
            return extractBindings((pattern as any).argument);

        case "AssignmentPattern":
            return extractBindings((pattern as any).left);

        default:
            return [];
    }
}
