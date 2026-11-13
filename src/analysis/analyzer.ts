import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type {
  AnalysisProgress,
  DependencyCruiserOutput,
  DependencyGraph,
  GraphEdge,
  GraphNode,
} from "../types";

export async function analyzeDependencies(
  projectPath: string,
  onProgress?: (progress: AnalysisProgress) => void
): Promise<DependencyGraph> {
  const unlisten = onProgress
    ? await listen<AnalysisProgress>("analysis-progress", (e) => onProgress(e.payload))
    : null;
  try {
    const raw = await invoke<DependencyCruiserOutput>("analyze_dependencies", {
      path: projectPath,
    });
    return transformToGraph(raw);
  } finally {
    unlisten?.();
  }
}

function isNpmDep(dependencyTypes: string[]): boolean {
  return dependencyTypes.some((t) => t === "npm" || t === "npm-dev" || t === "npm-optional");
}

function getPackageName(module: string): string {
  if (module.startsWith("@")) {
    const parts = module.split("/");
    return parts.slice(0, 2).join("/");
  }
  return module.split("/")[0];
}

function transformToGraph(output: DependencyCruiserOutput): DependencyGraph {
  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();
  const lineCounts = output.lineCounts ?? {};

  for (const mod of output.modules) {
    const source = mod.source;
    if (source.startsWith("node_modules")) continue;

    if (!nodeMap.has(source)) {
      nodeMap.set(source, makeNode(source, false, lineCounts[source] ?? 0));
    }

    for (const dep of mod.dependencies) {
      if (!dep.resolved && !dep.module) continue;

      const external = isNpmDep(dep.dependencyTypes);
      const target = external ? getPackageName(dep.module) : dep.resolved;
      if (!target) continue;

      if (!nodeMap.has(target)) {
        nodeMap.set(target, makeNode(target, external, lineCounts[target] ?? 0));
      }

      const edgeKey = `${source}|${target}`;
      if (edgeSet.has(edgeKey)) continue;
      edgeSet.add(edgeKey);

      edges.push({
        source,
        target,
        circular: dep.circular ?? false,
        dynamic: dep.dynamic,
        dependencyTypes: dep.dependencyTypes,
      });

      nodeMap.get(source)!.outDegree++;
      nodeMap.get(target)!.inDegree++;
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges,
  };
}

function makeNode(source: string, isExternal: boolean, lineCount: number): GraphNode {
  if (isExternal) {
    return {
      id: source,
      label: source,
      directory: "",
      extension: "npm",
      isExternal: true,
      lineCount: 0,
      inDegree: 0,
      outDegree: 0,
    };
  }

  const parts = source.split("/");
  const filename = parts[parts.length - 1];
  const directory = parts.slice(0, -1).join("/");
  const ext = filename.includes(".") ? filename.split(".").pop()! : "";

  return {
    id: source,
    label: filename,
    directory,
    extension: ext,
    isExternal: false,
    lineCount,
    inDegree: 0,
    outDegree: 0,
  };
}
