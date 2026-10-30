export interface DependencyCruiserModule {
  source: string;
  dependencies: DependencyCruiserDependency[];
}

export interface DependencyCruiserDependency {
  resolved: string;
  module: string;
  dependencyTypes: string[];
  dynamic: boolean;
  circular?: boolean;
}

export interface DependencyCruiserOutput {
  modules: DependencyCruiserModule[];
  lineCounts: Record<string, number>;
  summary: {
    totalCruised: number;
    violations: unknown[];
    error: number;
    warn: number;
    info: number;
  };
}

export interface GraphNode {
  id: string;
  label: string;
  directory: string;
  extension: string;
  isExternal: boolean;
  lineCount: number;
  inDegree: number;
  outDegree: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  circular: boolean;
  dynamic: boolean;
  dependencyTypes: string[];
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type LayoutName = "cose" | "breadthfirst" | "circle" | "concentric" | "grid";
