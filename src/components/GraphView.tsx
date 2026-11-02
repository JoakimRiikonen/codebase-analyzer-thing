import cytoscape, { type Core } from "cytoscape";
import { useCallback, useEffect, useRef } from "react";
import type { DependencyGraph, GraphNode, LayoutName } from "../types";
import styles from "./GraphView.module.css";

const NODE_SIZE_MIN = 5;
const NODE_SIZE_MAX = 60;
const NODE_SIZE_EXTERNAL = 20;

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

interface GraphViewProps {
  graph: DependencyGraph | null;
  layout: LayoutName;
  showFullPath: boolean;
  showExternal: boolean;
  hiddenExtensions: Set<string>;
  selectedNodeId: string | null;
  onSelectNode: (node: GraphNode | null) => void;
}

export default function GraphView({
  graph,
  layout,
  showFullPath,
  showExternal,
  hiddenExtensions,
  selectedNodeId,
  onSelectNode,
}: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const initCytoscape = useCallback(() => {
    if (!containerRef.current) return;

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    cyRef.current = cytoscape({
      container: containerRef.current,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "background-color": "data(color)",
            color: "#e0e0e0",
            "font-size": "10px",
            "text-valign": "bottom",
            "text-margin-y": 6,
            "min-zoomed-font-size": 8,
            width: "data(size)",
            height: "data(size)",
            "border-width": 1,
            "border-color": "#555",
            "text-outline-color": "#1a1a2e",
            "text-outline-width": 2,
          },
        },
        {
          selector: "node.external",
          style: {
            shape: "diamond",
            "border-style": "dashed",
            "border-color": "#cb3837",
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-width": 3,
            "border-color": "#7c3aed",
            "background-color": "#7c3aed",
          },
        },
        {
          selector: "node.highlighted",
          style: {
            "border-width": 2,
            "border-color": "#22d3ee",
          },
        },
        {
          selector: "node.dimmed",
          style: {
            opacity: 0.15,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1,
            "line-color": "#444",
            "target-arrow-color": "#444",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "arrow-scale": 0.8,
          },
        },
        {
          selector: "edge.circular",
          style: {
            "line-color": "#ef4444",
            "target-arrow-color": "#ef4444",
            "line-style": "dashed",
            width: 2,
          },
        },
        {
          selector: "edge.dependency",
          style: {
            "line-color": "#ef4444",
            "target-arrow-color": "#ef4444",
            width: 2,
          },
        },
        {
          selector: "edge.dependent",
          style: {
            "line-color": "#22c55e",
            "target-arrow-color": "#22c55e",
            width: 2,
          },
        },
        {
          selector: "edge.dimmed",
          style: {
            opacity: 0.08,
          },
        },
      ],
      minZoom: 0.1,
      maxZoom: 5,
      wheelSensitivity: 3,
    });

    cyRef.current.on("tap", "node", (evt) => {
      const nodeId = evt.target.id();
      const node = graph?.nodes.find((n) => n.id === nodeId) ?? null;
      onSelectNode(node);
      highlightConnected(evt.target);
    });

    cyRef.current.on("tap", (evt) => {
      if (evt.target === cyRef.current) {
        onSelectNode(null);
        clearHighlights();
      }
    });

  }, [graph, onSelectNode]);

  const highlightConnected = useCallback((node: cytoscape.NodeSingular) => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.elements().addClass("dimmed").removeClass("dependency dependent highlighted");

    node.removeClass("dimmed");
    node.connectedEdges().forEach((edge) => {
      edge.removeClass("dimmed");
      if (edge.source().id() === node.id()) {
        edge.addClass("dependency");
        edge.target().removeClass("dimmed").addClass("highlighted");
      } else {
        edge.addClass("dependent");
        edge.source().removeClass("dimmed").addClass("highlighted");
      }
    });
  }, []);

  const clearHighlights = useCallback(() => {
    cyRef.current?.elements().removeClass("dimmed highlighted dependency dependent");
  }, []);

  useEffect(() => {
    initCytoscape();
    return () => {
      cyRef.current?.destroy();
    };
  }, [initCytoscape]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !graph) return;

    cy.elements().remove();

    const elements: cytoscape.ElementDefinition[] = [];

    const visibleNodes = new Set<string>();

    for (const node of graph.nodes) {
      if (!showExternal && node.isExternal) continue;
      if (!node.isExternal && hiddenExtensions.has(node.extension)) continue;
      visibleNodes.add(node.id);

      const loc = node.lineCount || 1;
      const size = node.isExternal ? NODE_SIZE_EXTERNAL : Math.max(NODE_SIZE_MIN, Math.min(NODE_SIZE_MAX, NODE_SIZE_MIN + Math.sqrt(loc) * 2));

      const h = hashString(node.id);
      const h2 = hashString(node.id + "_y");

      elements.push({
        position: {
          x: (h % 2000) - 1000,
          y: (h2 % 2000) - 1000,
        },
        data: {
          id: node.id,
          label: showFullPath ? node.id : node.label,
          color: EXT_COLORS[node.extension] ?? "#888",
          size,
        },
        classes: node.isExternal ? "external" : undefined,
      });
    }

    for (let i = 0; i < graph.edges.length; i++) {
      const edge = graph.edges[i];
      if (!visibleNodes.has(edge.source) || !visibleNodes.has(edge.target)) continue;
      elements.push({
        data: {
          id: `e${i}`,
          source: edge.source,
          target: edge.target,
        },
        classes: edge.circular ? "circular" : undefined,
      });
    }

    cy.add(elements);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layoutOptions: any = {
      name: layout,
      animate: true,
      animationDuration: 500,
    };
    if (layout === "cose") {
      layoutOptions.randomize = false;
      layoutOptions.nodeRepulsion = () => 20000;
      layoutOptions.idealEdgeLength = () => 100;
      layoutOptions.edgeElasticity = () => 200;
      layoutOptions.gravity = 0.8;
      layoutOptions.nodeOverlap = 40;
      layoutOptions.numIter = 2000;
    } else {
      layoutOptions.spacingFactor = 1.75;
    }
    cy.layout(layoutOptions).run();
    cy.fit(undefined, 40);
  }, [graph, layout, showExternal, hiddenExtensions]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !graph) return;

    for (const node of graph.nodes) {
      const el = cy.getElementById(node.id);
      if (el.length) {
        el.data("label", showFullPath ? node.id : node.label);
      }
    }
  }, [showFullPath, graph]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    if (!selectedNodeId) {
      clearHighlights();
      cy.nodes().unselect();
      return;
    }

    const el = cy.getElementById(selectedNodeId);
    if (el.length && el.isNode()) {
      cy.nodes().unselect();
      el.select();
      highlightConnected(el);
    }
  }, [selectedNodeId, highlightConnected, clearHighlights]);

  return <div ref={containerRef} className={styles.container} />;
}
