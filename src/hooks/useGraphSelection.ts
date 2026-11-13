import { useCallback, useMemo, useState } from "react";
import { findNode, getDependencyPaths, getDependentPaths } from "../analysis/graphQueries";
import type { DependencyGraph, GraphNode } from "../types";

/**
 * The selected file and what it imports / is imported by within `visibleGraph`.
 * The selection clears whenever a different project graph is loaded, but survives
 * changes to `visibleGraph` such as excluding files.
 */
export function useGraphSelection(
  projectGraph: DependencyGraph | null,
  visibleGraph: DependencyGraph | null,
) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectionGraph, setSelectionGraph] = useState(projectGraph);
  if (projectGraph !== selectionGraph) {
    setSelectionGraph(projectGraph);
    setSelectedNode(null);
  }

  const selectedId = selectedNode?.id ?? null;

  const dependencyPaths = useMemo(
    () => getDependencyPaths(visibleGraph, selectedId),
    [visibleGraph, selectedId],
  );
  const dependentPaths = useMemo(
    () => getDependentPaths(visibleGraph, selectedId),
    [visibleGraph, selectedId],
  );

  const selectByPath = useCallback(
    (path: string) => setSelectedNode(findNode(visibleGraph, path)),
    [visibleGraph],
  );

  return { selectedNode, setSelectedNode, selectByPath, dependencyPaths, dependentPaths };
}
