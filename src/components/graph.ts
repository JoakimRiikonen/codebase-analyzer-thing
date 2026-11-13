import type { RefObject } from "react";
import Sigma from "sigma";
import { extremityArrow } from "sigma/rendering";
import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { circular } from "graphology-layout";
import type { DependencyGraph, LayoutName } from "../types";

const NODE_SIZE_MIN = 3;
const NODE_SIZE_MAX = 20;
const NODE_SIZE_EXTERNAL = 8;

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const EXT_COLORS: Record<string, string> = {
  ts: "#3178c6",
  tsx: "#61dafb",
  js: "#f7df1e",
  jsx: "#f7df1e",
  json: "#a3a3a3",
  css: "#264de4",
  scss: "#cd6799",
  npm: "#cb3837",
};

export interface Highlight {
  node: string;
  deps: Set<string>;
  dependents: Set<string>;
}

/** Builds a graphology graph from the nodes and edges that pass the current filters. */
export function buildGraphology(
  graph: DependencyGraph,
  showExternal: boolean,
  hiddenExtensions: Set<string>,
  showFullPath: boolean,
): Graph {
  const g = new Graph({ type: "directed" });
  const visibleNodes = new Set<string>();

  for (const node of graph.nodes) {
    if (!showExternal && node.isExternal) continue;
    if (!node.isExternal && hiddenExtensions.has(node.extension)) continue;
    visibleNodes.add(node.id);

    const loc = node.lineCount || 1;
    const size = node.isExternal
      ? NODE_SIZE_EXTERNAL
      : Math.max(NODE_SIZE_MIN, Math.min(NODE_SIZE_MAX, NODE_SIZE_MIN + Math.sqrt(loc) * 0.8));

    const h = hashString(node.id);
    const h2 = hashString(node.id + "_y");

    g.addNode(node.id, {
      x: (h % 2000) - 1000,
      y: (h2 % 2000) - 1000,
      size,
      color: EXT_COLORS[node.extension] ?? "#888888",
      label: showFullPath ? node.id : node.label,
      origColor: EXT_COLORS[node.extension] ?? "#888888",
    });
  }

  for (const edge of graph.edges) {
    if (!visibleNodes.has(edge.source) || !visibleNodes.has(edge.target)) continue;
    if (edge.source === edge.target) continue;
    if (g.hasEdge(edge.source, edge.target)) continue;
    g.addEdge(edge.source, edge.target, {
      color: edge.circular ? "#ef4444" : "#555555",
      origColor: edge.circular ? "#ef4444" : "#555555",
      size: edge.circular ? 2 : 1,
    });
  }

  return g;
}

/** Creates the Sigma renderer. The reducers restyle nodes and edges around the highlighted node. */
export function createSigma(
  g: Graph,
  container: HTMLElement,
  highlightRef: RefObject<Highlight | null>,
): Sigma {
  return new Sigma(g, container, {
    primitives: {
      edges: {
        extremities: [extremityArrow({ lengthRatio: 4, widthRatio: 3 })],
        defaultHead: "arrow",
      },
    },
    settings: {
      allowInvalidContainer: true,
      labelRenderedSizeThreshold: 0,
      stagePadding: 40,
      zoomDuration: 100,
      itemSizesReference: "screen",
    },
    styles: {
      nodes: {
        x: { attribute: "x" },
        y: { attribute: "y" },
        size: { attribute: "size", defaultValue: 8 },
        color: { attribute: "color", defaultValue: "#888" },
        label: { attribute: "label" },
        labelColor: "#ffffff",
        labelFont: "monospace",
        labelSize: 11,
        labelVisibility: "visible",
      },
      edges: {
        size: { attribute: "size", defaultValue: 1 },
        color: { attribute: "color", defaultValue: "#555" },
      },
      stage: {
        background: "#0f0f1a",
      },
    },
    nodeReducer: (_node, data) => {
      const hl = highlightRef.current;
      if (!hl) return data;
      if (_node === hl.node) return { ...data, highlighted: true, zIndex: 2 };
      if (hl.deps.has(_node) || hl.dependents.has(_node)) return { ...data, zIndex: 1 };
      return { ...data, color: "#333333", label: null, zIndex: 0 };
    },
    edgeReducer: (edge, data) => {
      const hl = highlightRef.current;
      if (!hl) return data;
      const source = g.source(edge);
      const target = g.target(edge);
      if (source === hl.node) return { ...data, color: "#ef4444", size: 2, zIndex: 1 };
      if (target === hl.node) return { ...data, color: "#22c55e", size: 2, zIndex: 1 };
      return { ...data, color: "#2a2a3a", zIndex: 0 };
    },
  });
}

/** Positions the nodes according to the selected layout. */
export function applyLayout(g: Graph, layout: LayoutName) {
  if (layout === "cose") {
    const settings = forceAtlas2.inferSettings(g);
    settings.gravity = 0.05;
    settings.barnesHutOptimize = g.order > 200;
    settings.slowDown = 5;
    forceAtlas2.assign(g, { settings, iterations: Math.min(500, Math.max(100, g.order)) });
  } else if (layout === "circle") {
    circular.assign(g);
  } else if (layout === "grid") {
    const nodes = g.nodes();
    const cols = Math.ceil(Math.sqrt(nodes.length));
    nodes.forEach((node, i) => {
      g.setNodeAttribute(node, "x", (i % cols) * 10);
      g.setNodeAttribute(node, "y", Math.floor(i / cols) * 10);
    });
  } else if (layout === "breadthfirst") {
    const nodes = g.nodes().sort((a, b) => g.outDegree(b) - g.outDegree(a));
    const cols = Math.ceil(Math.sqrt(nodes.length));
    nodes.forEach((node, i) => {
      g.setNodeAttribute(node, "x", (i % cols) * 10);
      g.setNodeAttribute(node, "y", Math.floor(i / cols) * 10);
    });
  }
}
