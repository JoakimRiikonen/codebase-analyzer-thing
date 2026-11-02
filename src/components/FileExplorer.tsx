import { useState } from "react";
import type { FileEntry } from "../types";
import styles from "./FileExplorer.module.css";


interface TreeNodeProps {
  entry: FileEntry;
  depth: number;
  graphPaths: Set<string>;
  selectedPath: string | null;
  dependencyPaths: Set<string>;
  dependentPaths: Set<string>;
  onSelect: (path: string) => void;
}

function hasDescendantIn(entry: FileEntry, paths: Set<string>): boolean {
  if (paths.has(entry.path)) return true;
  return entry.children.some((child) => hasDescendantIn(child, paths));
}

function TreeNode({ entry, depth, graphPaths, selectedPath, dependencyPaths, dependentPaths, onSelect }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const inGraph = graphPaths.has(entry.path);
  const isActive = selectedPath === entry.path;
  const isDependency = entry.is_dir ? hasDescendantIn(entry, dependencyPaths) : dependencyPaths.has(entry.path);
  const isDependent = entry.is_dir ? hasDescendantIn(entry, dependentPaths) : dependentPaths.has(entry.path);

  if (entry.is_dir) {
    const dirClassNames = [
      styles.item,
      isDependency ? styles.dependency : "",
      isDependent ? styles.dependent : "",
    ].filter(Boolean).join(" ");

    return (
      <>
        <button
          className={dirClassNames}
          style={{ paddingLeft: 8 + depth * 14 }}
          onClick={() => setExpanded((v) => !v)}
        >
          <span className={`${styles.chevron} ${expanded ? styles.chevronOpen : ""}`}>
            &#9654;
          </span>
          <span className={styles.icon}>&#128193;</span>
          <span className={styles.name}>{entry.name}</span>
        </button>
        {expanded &&
          entry.children.map((child) => (
            <TreeNode
              key={child.path}
              entry={child}
              depth={depth + 1}
              graphPaths={graphPaths}
              selectedPath={selectedPath}
              dependencyPaths={dependencyPaths}
              dependentPaths={dependentPaths}
              onSelect={onSelect}
            />
          ))}
      </>
    );
  }

  const classNames = [
    styles.item,
    inGraph ? styles.inGraph : "",
    isActive ? styles.active : "",
    isDependency ? styles.dependency : "",
    isDependent ? styles.dependent : "",
  ].filter(Boolean).join(" ");

  return (
    <button
      className={classNames}
      style={{ paddingLeft: 8 + depth * 14 + 18 }}
      onClick={() => onSelect(entry.path)}
    >
      <span className={styles.name}>{entry.name}</span>
    </button>
  );
}

interface FileExplorerProps {
  fileTree: FileEntry[];
  graphPaths: Set<string>;
  selectedPath: string | null;
  dependencyPaths: Set<string>;
  dependentPaths: Set<string>;
  onSelectFile: (path: string) => void;
}

export default function FileExplorer({ fileTree, graphPaths, selectedPath, dependencyPaths, dependentPaths, onSelectFile }: FileExplorerProps) {
  if (fileTree.length === 0) {
    return (
      <div className={styles.explorer}>
        <div className={styles.header}>Explorer</div>
        <div className={styles.empty}>No project loaded</div>
      </div>
    );
  }

  return (
    <div className={styles.explorer}>
      <div className={styles.header}>Explorer</div>
      <div className={styles.tree}>
        {fileTree.map((entry) => (
          <TreeNode
            key={entry.path}
            entry={entry}
            depth={0}
            graphPaths={graphPaths}
            selectedPath={selectedPath}
            dependencyPaths={dependencyPaths}
            dependentPaths={dependentPaths}
            onSelect={onSelectFile}
          />
        ))}
      </div>
    </div>
  );
}
