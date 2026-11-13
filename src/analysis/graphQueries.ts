import type { DependencyGraph, GraphNode } from "../types";

/** File extensions of the project's own files, sorted, for the extension filter. */
export function getAvailableExtensions(graph: DependencyGraph | null): string[] {
  if (!graph) return [];
  const exts = new Set<string>();
  for (const node of graph.nodes) {
    if (!node.isExternal && node.extension) exts.add(node.extension);
  }
  return [...exts].sort();
}

/**
 * Removes the nodes matching `isExcluded`, along with any edges touching them. External
 * packages that were only imported by excluded files are removed too, rather than being
 * left on the graph unconnected.
 */
export function filterGraph(
  graph: DependencyGraph,
  isExcluded: (path: string) => boolean,
): DependencyGraph {
  const kept = graph.nodes.filter((n) => !isExcluded(n.id));
  const keptIds = new Set(kept.map((n) => n.id));
  const edges = graph.edges.filter((e) => keptIds.has(e.source) && keptIds.has(e.target));
  const linked = new Set(edges.flatMap((e) => [e.source, e.target]));
  const nodes = kept.filter((n) => !n.isExternal || linked.has(n.id));
  return { nodes, edges };
}

/** Paths of the project's own files in the graph (external packages left out). */
export function getProjectFilePaths(graph: DependencyGraph | null): Set<string> {
  if (!graph) return new Set();
  return new Set(graph.nodes.filter((n) => !n.isExternal).map((n) => n.id));
}

/** Paths the given node imports. */
export function getDependencyPaths(graph: DependencyGraph | null, nodeId: string | null): Set<string> {
  const deps = new Set<string>();
  if (!graph || !nodeId) return deps;
  for (const edge of graph.edges) {
    if (edge.source === nodeId) deps.add(edge.target);
  }
  return deps;
}

/** Paths that import the given node. */
export function getDependentPaths(graph: DependencyGraph | null, nodeId: string | null): Set<string> {
  const deps = new Set<string>();
  if (!graph || !nodeId) return deps;
  for (const edge of graph.edges) {
    if (edge.target === nodeId) deps.add(edge.source);
  }
  return deps;
}

export function findNode(graph: DependencyGraph | null, path: string): GraphNode | null {
  return graph?.nodes.find((n) => n.id === path) ?? null;
}
