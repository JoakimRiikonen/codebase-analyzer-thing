import { open } from "@tauri-apps/plugin-dialog";
import { useCallback, useMemo, useState } from "react";
import styles from "./App.module.css";
import { analyzeDependencies } from "./analysis/analyzer";
import GraphView from "./components/GraphView";
import Sidebar from "./components/Sidebar";
import Toolbar from "./components/Toolbar";
import type { DependencyGraph, GraphNode, LayoutName } from "./types";

export default function App() {
  const [graph, setGraph] = useState<DependencyGraph | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [layout, setLayout] = useState<LayoutName>("cose");
  const [showFullPath, setShowFullPath] = useState(false);
  const [showExternal, setShowExternal] = useState(true);
  const [hiddenExtensions, setHiddenExtensions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableExtensions = useMemo(() => {
    if (!graph) return [];
    const exts = new Set<string>();
    for (const node of graph.nodes) {
      if (!node.isExternal && node.extension) exts.add(node.extension);
    }
    return [...exts].sort();
  }, [graph]);

  const handleOpenProject = useCallback(async () => {
    const selected = await open({ directory: true, multiple: false });
    if (!selected) return;

    setLoading(true);
    setError(null);
    setSelectedNode(null);

    try {
      const result = await analyzeDependencies(selected);
      setGraph(result);
      setProjectPath(selected);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setGraph(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className={styles.app}>
      <Toolbar
        projectPath={projectPath}
        loading={loading}
        layout={layout}
        showFullPath={showFullPath}
        showExternal={showExternal}
        availableExtensions={availableExtensions}
        hiddenExtensions={hiddenExtensions}
        onOpenProject={handleOpenProject}
        onLayoutChange={setLayout}
        onToggleFullPath={() => setShowFullPath((v) => !v)}
        onToggleExternal={() => setShowExternal((v) => !v)}
        onToggleExtension={(ext) =>
          setHiddenExtensions((prev) => {
            const next = new Set(prev);
            if (next.has(ext)) next.delete(ext);
            else next.add(ext);
            return next;
          })
        }
      />
      <div className={styles.mainContent}>
        <div className={styles.graphPanel}>
          {error && (
            <div className={styles.errorBanner}>
              <p>{error}</p>
              <button onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}
          {!graph && !loading && !error && (
            <div className={styles.emptyState}>
              <h2>No project loaded</h2>
              <p>Click "Open Project" to select a TypeScript project folder.</p>
            </div>
          )}
          {loading && (
            <div className={styles.emptyState}>
              <div className={styles.spinner} />
              <p>Analyzing dependencies...</p>
            </div>
          )}
          <GraphView
            graph={graph}
            layout={layout}
            showFullPath={showFullPath}
            showExternal={showExternal}
            hiddenExtensions={hiddenExtensions}
            onSelectNode={setSelectedNode}
          />
        </div>
        <Sidebar graph={graph} selectedNode={selectedNode} />
      </div>
    </div>
  );
}
