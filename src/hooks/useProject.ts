import { open } from "@tauri-apps/plugin-dialog";
import { useCallback, useMemo, useState } from "react";
import { analyzeDependencies, readFileTree } from "../analysis/analyzer";
import { getAvailableExtensions } from "../analysis/graphQueries";
import type { AnalysisProgress, DependencyGraph, FileEntry } from "../types";

/** The loaded project: picking a folder, analyzing it, and the results or error. */
export function useProject() {
  const [graph, setGraph] = useState<DependencyGraph | null>(null);
  const [fileTree, setFileTree] = useState<FileEntry[]>([]);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableExtensions = useMemo(() => getAvailableExtensions(graph), [graph]);

  const openProject = useCallback(async () => {
    const selected = await open({ directory: true, multiple: false });
    if (!selected) return;

    setLoading(true);
    setProgress(null);
    setError(null);
    setGraph(null);
    setFileTree([]);

    try {
      const [result, tree] = await Promise.all([
        analyzeDependencies(selected, setProgress),
        readFileTree(selected),
      ]);
      setGraph(result);
      setFileTree(tree);
      setProjectPath(selected);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setGraph(null);
      setFileTree([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  return {
    graph,
    fileTree,
    projectPath,
    loading,
    progress,
    error,
    availableExtensions,
    openProject,
    dismissError,
  };
}
