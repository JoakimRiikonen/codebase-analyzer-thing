import type { DependencyGraph, GraphNode } from "../types";
import CollapsiblePane from "./CollapsiblePane";
import styles from "./DetailsPane.module.css";

interface SidebarProps {
  graph: DependencyGraph | null;
  selectedNode: GraphNode | null;
}

export default function DetailsPane(props: SidebarProps) {
  return (
    <CollapsiblePane title="Details" side="right" defaultWidth={280}>
      <Details {...props} />
    </CollapsiblePane>
  );
}

function Details({ graph, selectedNode }: SidebarProps) {
  if (!graph) {
    return (
      <aside className={styles.sidebar}>
        <div className={styles.empty}>
          <p>Open a TypeScript project to visualize its dependency graph.</p>
        </div>
      </aside>
    );
  }

  if (!selectedNode) {
    return (
      <aside className={styles.sidebar}>
        <div className={styles.empty}>
          <p>Please select a node to see details</p>
        </div>
      </aside>
    );
  }

  const dependencies = graph.edges.filter((e) => e.source === selectedNode.id);
  const dependents = graph.edges.filter((e) => e.target === selectedNode.id);

  return (
    <aside className={styles.sidebar}>
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
        </div>

        <h4 className={styles.subTitle}>
          Dependencies <span className={styles.count}>{dependencies.length}</span>
        </h4>
        <ul className={styles.depList}>
          {dependencies.map((e) => (
            <li key={e.target} className={e.circular ? styles.depItemCircular : styles.depItem}>
              {e.target.split("/").pop()}
              {e.circular && <span className={styles.badge}>circular</span>}
            </li>
          ))}
        </ul>

        <h4 className={styles.subTitle}>
          Dependents <span className={styles.count}>{dependents.length}</span>
        </h4>
        <ul className={styles.depList}>
          {dependents.map((e) => (
            <li key={e.source} className={e.circular ? styles.depItemCircular : styles.depItem}>
              {e.source.split("/").pop()}
              {e.circular && <span className={styles.badge}>circular</span>}
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
