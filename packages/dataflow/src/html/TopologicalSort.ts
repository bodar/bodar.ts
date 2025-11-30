import {NodeDefinition} from "./NodeDefinition.ts";

/**
 * Topologically sort NodeDefinitions using Kahn's algorithm
 * @throws Error if circular dependency detected
 */
export function topologicalSort(definitions: NodeDefinition[]): NodeDefinition[] {
    const lookup = buildOutputLookup(definitions);
    const dependents = buildDependents(definitions, lookup)

    const indegree = new Map(definitions.map(d => [d, dependenciesOf(d, lookup).length]));
    const queue = definitions.filter(d => indegree.get(d) === 0);
    const sorted: NodeDefinition[] = [];

    while (queue.length > 0) {
        const node = queue.shift()!;
        sorted.push(node);
        for (const dep of dependents.get(node)!) {
            indegree.set(dep, indegree.get(dep)! - 1);
            if (indegree.get(dep) === 0) queue.push(dep);
        }
    }

    if (sorted.length !== definitions.length) {
        throw new Error('Circular dependency detected in node definitions');
    }
    return sorted;
}


function buildOutputLookup(definitions: NodeDefinition[]): Map<string, NodeDefinition> {
    const outputToNode = new Map<string, NodeDefinition>();
    for (const def of definitions) {
        for (const output of def.outputs) outputToNode.set(output, def);
    }
    return outputToNode;
}

function buildDependents(definitions: NodeDefinition[], outputToNode: Map<string, NodeDefinition>): Map<NodeDefinition, NodeDefinition[]> {
    const dependents = new Map(definitions.map(d => [d, [] as NodeDefinition[]]));
    for (const def of definitions) {
        for (const dep of dependenciesOf(def, outputToNode)) {
            dependents.get(dep)!.push(def);
        }
    }
    return dependents;
}

function dependenciesOf(definition: NodeDefinition, lookup: Map<string, NodeDefinition>): NodeDefinition[] {
    return definition.inputs
        .map(input => lookup.get(input))
        .filter((n): n is NodeDefinition => n !== undefined);
}

