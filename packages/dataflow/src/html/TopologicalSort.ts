import {NodeDefinition} from "./NodeDefinition.ts";

/**
 * Topologically sort NodeDefinitions using Kahn's algorithm
 * @throws Error if circular dependency detected
 */
export function topologicalSort(definitions: NodeDefinition[]): NodeDefinition[] {
    // Build output to node mapping
    const outputToNode = new Map<string, NodeDefinition>();
    for (const def of definitions) {
        for (const output of def.outputs) {
            outputToNode.set(output, def);
        }
    }

    // Build dependency graph and in-degree map
    const dependencies = new Map<NodeDefinition, Set<NodeDefinition>>();
    const inDegree = new Map<NodeDefinition, number>();

    for (const def of definitions) {
        if (!inDegree.has(def)) inDegree.set(def, 0);
        if (!dependencies.has(def)) dependencies.set(def, new Set());
    }

    // Build dependency edges
    for (const def of definitions) {
        // For each input, find which node produces it
        for (const input of def.inputs) {
            const provider = outputToNode.get(input);
            if (provider) {
                dependencies.get(provider)!.add(def);
                inDegree.set(def, inDegree.get(def)! + 1);
            }
        }
    }

    // Find all nodes with no dependencies (in-degree 0)
    const queue: NodeDefinition[] = [];
    for (const def of definitions) {
        if (inDegree.get(def) === 0) {
            queue.push(def);
        }
    }

    // Process queue
    const sorted: NodeDefinition[] = [];
    while (queue.length > 0) {
        const node = queue.shift()!;
        sorted.push(node);

        // For each node that depends on this one
        const dependents = dependencies.get(node) || new Set();
        for (const dependent of dependents) {
            const newInDegree = inDegree.get(dependent)! - 1;
            inDegree.set(dependent, newInDegree);

            if (newInDegree === 0) {
                queue.push(dependent);
            }
        }
    }

    // Check for cycles
    if (sorted.length !== definitions.length) {
        throw new Error('Circular dependency detected in node definitions');
    }

    return sorted;
}