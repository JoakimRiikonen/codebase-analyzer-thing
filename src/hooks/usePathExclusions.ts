import { useCallback, useMemo, useState } from "react";
import { filterGraph, getProjectFilePaths } from "../analysis/graphQueries";
import {
  EMPTY_RULES,
  excludeAllRules,
  isPathExcluded as isExcludedByRules,
  toggleExclusion as toggleRule,
  type ExclusionRules,
} from "../analysis/pathExclusions";
import type { DependencyGraph, FileEntry } from "../types";

/**
 * The user's exclude/include rules and the graph with them applied.
 * The rules reset whenever a different project graph is loaded.
 */
export function usePathExclusions(graph: DependencyGraph | null) {
  const [rules, setRules] = useState<ExclusionRules>(EMPTY_RULES);
  const [rulesGraph, setRulesGraph] = useState(graph);
  // Reset during render when the graph changes, so the stale rules are never applied
  if (graph !== rulesGraph) {
    setRulesGraph(graph);
    setRules(EMPTY_RULES);
  }

  const isPathExcluded = useCallback((path: string) => isExcludedByRules(path, rules), [rules]);

  const toggleExclusion = useCallback(
    (path: string) => setRules((prev) => toggleRule(path, prev)),
    [],
  );

  const includeAll = useCallback(() => setRules(EMPTY_RULES), []);

  const excludeAll = useCallback(
    (fileTree: FileEntry[]) => setRules(excludeAllRules(fileTree.map((e) => e.path))),
    [],
  );

  const hasExclusions = rules.excluded.size > 0;

  const filteredGraph = useMemo(() => {
    if (!graph || !hasExclusions) return graph;
    return filterGraph(graph, isPathExcluded);
  }, [graph, hasExclusions, isPathExcluded]);

  const graphPaths = useMemo(() => getProjectFilePaths(filteredGraph), [filteredGraph]);

  return {
    isPathExcluded,
    toggleExclusion,
    includeAll,
    excludeAll,
    hasExclusions,
    filteredGraph,
    graphPaths,
  };
}
