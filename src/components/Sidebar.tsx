import type { DependencyGraph, GraphNode } from "../types";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  graph: DependencyGraph | null;
  selectedNode: GraphNode | null;
}

export default function Sidebar({ graph, selectedNode }: SidebarProps) {
  if (!graph) {
    return (
      <aside className={styles.sidebar}>
        <div className={styles.empty}>
          <p>Open a TypeScript project to visualize its dependency graph.</p>
        </div>
      </aside>
    );
  }

  const circularEdges = graph.edges.filter((e) => e.circular);
  const stats = {
    files: graph.nodes.length,
    dependencies: graph.edges.length,
    circularDeps: circularEdges.length,
  };

  return (
    <aside className={styles.sidebar}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Project Stats</h3>
        <div className={styles.statGrid}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats.files}</span>
            <span className={styles.statLabel}>Files</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats.dependencies}</span>
            <span className={styles.statLabel}>Dependencies</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValueCircular}>{stats.circularDeps}</span>
            <span className={styles.statLabel}>Circular</span>
          </div>
        </div>
      </section>

      {selectedNode && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Selected File</h3>
          <div className={styles.nodeDetails}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Name</span>
              <span className={styles.detailValue}>{selectedNode.label}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Path</span>
              <span className={styles.detailValuePath}>{selectedNode.id}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Directory</span>
              <span className={styles.detailValue}>{selectedNode.directory || "/"}</span>
            </div>
            {selectedNode.lineCount > 0 && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Lines</span>
                <span className={styles.detailValue}>{selectedNode.lineCount}</span>
              </div>
            )}
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Imports</span>
              <span className={styles.detailValue}>{selectedNode.outDegree}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Imported by</span>
              <span className={styles.detailValue}>{selectedNode.inDegree}</span>
            </div>
          </div>

          <h4 className={styles.subTitle}>Dependencies</h4>
          <ul className={styles.depList}>
            {graph.edges
              .filter((e) => e.source === selectedNode.id)
              .map((e) => (
                <li key={e.target} className={e.circular ? styles.depItemCircular : styles.depItem}>
                  {e.target.split("/").pop()}
                  {e.circular && <span className={styles.badge}>circular</span>}
                </li>
              ))}
          </ul>

          <h4 className={styles.subTitle}>Dependents</h4>
          <ul className={styles.depList}>
            {graph.edges
              .filter((e) => e.target === selectedNode.id)
              .map((e) => (
                <li key={e.source} className={e.circular ? styles.depItemCircular : styles.depItem}>
                  {e.source.split("/").pop()}
                  {e.circular && <span className={styles.badge}>circular</span>}
                </li>
              ))}
          </ul>
        </section>
      )}

      {!selectedNode && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Most Connected</h3>
          <ul className={styles.depList}>
            {[...graph.nodes]
              .sort((a, b) => b.inDegree + b.outDegree - (a.inDegree + a.outDegree))
              .slice(0, 10)
              .map((n) => (
                <li key={n.id} className={styles.depItem}>
                  {n.label}
                  <span className={styles.badgeNeutral}>
                    {n.inDegree + n.outDegree}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      )}
    </aside>
  );
}
