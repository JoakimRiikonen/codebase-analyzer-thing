import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useMemo, useState } from "react";
import styles from "./App.module.css";
import { analyzeDependencies } from "./analysis/analyzer";
import AnalysisProgress from "./components/AnalysisProgress";
import FileExplorerPane from "./components/file-explorer/FileExplorerPane";
import GraphView from "./components/GraphView";
import DetailsPane from "./components/DetailsPane";
import Toolbar from "./components/Toolbar";
import type {
  AnalysisProgress as AnalysisProgressData,
  DependencyGraph,
  FileEntry,
  GraphNode,
  LayoutName,
} from "./types";

export default function App() {
  const [graph, setGraph] = useState<DependencyGraph | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [layout, setLayout] = useState<LayoutName>("cose");
  const [showFullPath, setShowFullPath] = useState(false);
  const [showExternal, setShowExternal] = useState(true);
  const [hiddenExtensions, setHiddenExtensions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileEntry[]>([]);
  const [excludedPaths, setExcludedPaths] = useState<Set<string>>(new Set());
  const [includedPaths, setIncludedPaths] = useState<Set<string>>(new Set());

  const availableExtensions = useMemo(() => {
    if (!graph) return [];
    const exts = new Set<string>();
    for (const node of graph.nodes) {
      if (!node.isExternal && node.extension) exts.add(node.extension);
    }
    return [...exts].sort();
  }, [graph]);

  const isPathExcluded = useCallback((path: string) => {
    let deepestRule = "";
    let excluded = false;
    for (const ep of excludedPaths) {
      if (ep === path || path.startsWith(ep + "/")) {
        if (ep.length > deepestRule.length) {
          deepestRule = ep;
          excluded = true;
        }
      }
    }
    for (const ip of includedPaths) {
      if (ip === path || path.startsWith(ip + "/")) {
        if (ip.length > deepestRule.length) {
          deepestRule = ip;
          excluded = false;
        }
      }
    }
    return excluded;
  }, [excludedPaths, includedPaths]);

  const filteredGraph = useMemo(() => {
    if (!graph || excludedPaths.size === 0) return graph;
    const nodes = graph.nodes.filter((n) => !isPathExcluded(n.id));
    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = graph.edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
    return { nodes, edges };
  }, [graph, excludedPaths, isPathExcluded]);

  const graphPaths = useMemo(() => {
    if (!filteredGraph) return new Set<string>();
    return new Set(filteredGraph.nodes.filter((n) => !n.isExternal).map((n) => n.id));
  }, [filteredGraph]);

  const dependencyPaths = useMemo(() => {
    if (!filteredGraph || !selectedNode) return new Set<string>();
    const deps = new Set<string>();
    for (const edge of filteredGraph.edges) {
      if (edge.source === selectedNode.id) deps.add(edge.target);
    }
    return deps;
  }, [filteredGraph, selectedNode]);

  const dependentPaths = useMemo(() => {
    if (!filteredGraph || !selectedNode) return new Set<string>();
    const deps = new Set<string>();
    for (const edge of filteredGraph.edges) {
      if (edge.target === selectedNode.id) deps.add(edge.source);
    }
    return deps;
  }, [filteredGraph, selectedNode]);

  const handleOpenProject = useCallback(async () => {
    const selected = await open({ directory: true, multiple: false });
    if (!selected) return;

    setLoading(true);
    setProgress(null);
    setError(null);
    setSelectedNode(null);
    setGraph(null);
    setFileTree([]);
    setExcludedPaths(new Set());
    setIncludedPaths(new Set());

    try {
      const [result, tree] = await Promise.all([
        analyzeDependencies(selected, setProgress),
        invoke<FileEntry[]>("read_file_tree", { path: selected }),
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

  const handleFileSelect = useCallback(
    (path: string) => {
      const node = filteredGraph?.nodes.find((n) => n.id === path) ?? null;
      setSelectedNode(node);
    },
    [filteredGraph],
  );

  const handleToggleExclude = useCallback((path: string) => {
    if (isPathExcluded(path)) {
      setIncludedPaths((prev) => {
        const next = new Set(prev);
        next.add(path);
        return next;
      });
      setExcludedPaths((prev) => {
        const next = new Set(prev);
        next.delete(path);
        return next;
      });
    } else {
      setExcludedPaths((prev) => {
        const next = new Set(prev);
        next.add(path);
        return next;
      });
      setIncludedPaths((prev) => {
        const next = new Set(prev);
        next.delete(path);
        return next;
      });
    }
  }, [isPathExcluded]);

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
        <FileExplorerPane
          fileTree={fileTree}
          graphPaths={graphPaths}
          selectedPath={selectedNode?.id ?? null}
          dependencyPaths={dependencyPaths}
          dependentPaths={dependentPaths}
          isPathExcluded={isPathExcluded}
          onSelectFile={handleFileSelect}
          onToggleExclude={handleToggleExclude}
        />
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
              <AnalysisProgress progress={progress} />
            </div>
          )}
          <GraphView
            graph={filteredGraph}
            layout={layout}
            showFullPath={showFullPath}
            showExternal={showExternal}
            hiddenExtensions={hiddenExtensions}
            selectedNodeId={selectedNode?.id ?? null}
            onSelectNode={setSelectedNode}
          />
        </div>
        <DetailsPane graph={filteredGraph} selectedNode={selectedNode} />
      </div>
    </div>
  );
}
