import { useEffect, useRef } from "react";
import type Sigma from "sigma";
import type Graph from "graphology";
import type { DependencyGraph, GraphNode, ViewSettings } from "../types";
import { applyLayout, buildGraphology, createSigma, type Highlight } from "./graph";
import styles from "./GraphView.module.css";

interface GraphViewProps {
  graph: DependencyGraph | null;
  settings: ViewSettings;
  selectedNodeId: string | null;
  onSelectNode: (node: GraphNode | null) => void;
}

export default function GraphView({
  graph,
  settings,
  selectedNodeId,
  onSelectNode,
}: GraphViewProps) {
  // Effects depend on these individual fields rather than `settings`, so e.g. toggling
  // full paths only relabels nodes instead of rebuilding the graph and rerunning the layout
  const { layout, showFullPath, showExternal, hiddenExtensions } = settings;
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphologyRef = useRef<Graph | null>(null);
  const graphDataRef = useRef<DependencyGraph | null>(null);
  const onSelectNodeRef = useRef(onSelectNode);
  const showFullPathRef = useRef(showFullPath);

  useEffect(() => {
    onSelectNodeRef.current = onSelectNode;
  }, [onSelectNode]);

  useEffect(() => {
    showFullPathRef.current = showFullPath;
  }, [showFullPath]);

  const highlightRef = useRef<Highlight | null>(null);

  // Build the graph and renderer
  useEffect(() => {
    sigmaRef.current?.kill();
    sigmaRef.current = null;
    graphologyRef.current = null;
    highlightRef.current = null;

    if (!containerRef.current || !graph) {
      graphDataRef.current = null;
      return;
    }

    graphDataRef.current = graph;

    const g = buildGraphology(graph, showExternal, hiddenExtensions, showFullPathRef.current);
    graphologyRef.current = g;

    const sigma = createSigma(g, containerRef.current, highlightRef);
    sigmaRef.current = sigma;

    sigma.on("clickNode", ({ node }) => {
      const gd = graphDataRef.current;
      const gNode = gd?.nodes.find((n) => n.id === node) ?? null;
      onSelectNodeRef.current(gNode);
    });

    sigma.on("clickStage", () => {
      onSelectNodeRef.current(null);
    });

    applyLayout(g, layout);

    return () => {
      sigmaRef.current?.kill();
      sigmaRef.current = null;
      graphologyRef.current = null;
    };
  }, [graph, layout, showExternal, hiddenExtensions]);

  // Handle selection changes
  useEffect(() => {
    const g = graphologyRef.current;
    const sigma = sigmaRef.current;

    if (!selectedNodeId || !g || !sigma || !g.hasNode(selectedNodeId)) {
      highlightRef.current = null;
      sigma?.refresh();
      return;
    }

    const deps = new Set<string>();
    const dependents = new Set<string>();
    g.forEachOutNeighbor(selectedNodeId, (neighbor) => deps.add(neighbor));
    g.forEachInNeighbor(selectedNodeId, (neighbor) => dependents.add(neighbor));

    highlightRef.current = { node: selectedNodeId, deps, dependents };
    sigma.refresh();
  }, [selectedNodeId]);

  // Sigma only listens for window resizes, so watch the container for pane collapse/expand
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // resize() alone clears the canvases without redrawing; scheduleRefresh() resizes and redraws
    const observer = new ResizeObserver(() => sigmaRef.current?.scheduleRefresh());
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Handle label toggle
  useEffect(() => {
    const g = graphologyRef.current;
    const sigma = sigmaRef.current;
    const gd = graphDataRef.current;
    if (!g || !sigma || !gd) return;

    for (const node of gd.nodes) {
      if (g.hasNode(node.id)) {
        g.setNodeAttribute(node.id, "label", showFullPath ? node.id : node.label);
      }
    }
    sigma.refresh();
  }, [showFullPath]);

  return <div ref={containerRef} className={styles.container} />;
}
