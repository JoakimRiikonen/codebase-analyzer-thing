import { useState } from "react";
import type { FileEntry } from "../../types";
import styles from "./TreeNode.module.css";

interface TreeNodeProps {
  entry: FileEntry;
  depth: number;
  graphPaths: Set<string>;
  selectedPath: string | null;
  dependencyPaths: Set<string>;
  dependentPaths: Set<string>;
  isPathExcluded: (path: string) => boolean;
  onSelect: (path: string) => void;
  onToggleExclude: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, path: string, isDir: boolean) => void;
}

export default function TreeNode({ entry, depth, graphPaths, selectedPath, dependencyPaths, dependentPaths, isPathExcluded, onSelect, onToggleExclude, onContextMenu }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const inGraph = graphPaths.has(entry.path);
  const isActive = selectedPath === entry.path;
  const isDependency = entry.is_dir ? hasDescendantIn(entry, dependencyPaths) : dependencyPaths.has(entry.path);
  const isDependent = entry.is_dir ? hasDescendantIn(entry, dependentPaths) : dependentPaths.has(entry.path);
  const excluded = isPathExcluded(entry.path);

  const rowClassNames = [
    styles.item,
    !entry.is_dir && inGraph ? styles.inGraph : "",
    !entry.is_dir && isActive ? styles.active : "",
    isDependency ? styles.dependency : "",
    isDependent ? styles.dependent : "",
    excluded ? styles.excluded : "",
  ].filter(Boolean).join(" ");

  const row = (
    <div
      className={rowClassNames}
      onContextMenu={(e) => onContextMenu(e, entry.path, entry.is_dir)}
    >
      <button
        className={styles.label}
        style={{ paddingLeft: 8 + depth * 14 + (entry.is_dir ? 0 : 18) }}
        onClick={() => (entry.is_dir ? setExpanded((v) => !v) : onSelect(entry.path))}
      >
        {entry.is_dir && (
          <>
            <span className={`${styles.chevron} ${expanded ? styles.chevronOpen : ""}`}>
              &#9654;
            </span>
            <span className={styles.icon}>&#128193;</span>
          </>
        )}
        <span className={styles.name}>{entry.name}</span>
      </button>
      <ExcludeToggle
        excluded={excluded}
        kind={entry.is_dir ? "folder" : "file"}
        onClick={() => onToggleExclude(entry.path)}
      />
    </div>
  );

  if (!entry.is_dir) return row;

  return (
    <>
      {row}
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
            isPathExcluded={isPathExcluded}
            onSelect={onSelect}
            onToggleExclude={onToggleExclude}
            onContextMenu={onContextMenu}
          />
        ))}
    </>
  );
}

interface ExcludeToggleProps {
  excluded: boolean;
  kind: "file" | "folder";
  onClick: () => void;
}

/** Eye icon: open while the path is included, crossed out once it's excluded. */
function ExcludeToggle({ excluded, kind, onClick }: ExcludeToggleProps) {
  const label = `${excluded ? "Include" : "Exclude"} ${kind}`;
  return (
    <button className={styles.excludeToggle} onClick={onClick} title={label} aria-label={label}>
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
        {excluded && <line x1="3" y1="3" x2="21" y2="21" />}
      </svg>
    </button>
  );
}

function hasDescendantIn(entry: FileEntry, paths: Set<string>): boolean {
  if (paths.has(entry.path)) return true;
  return entry.children.some((child) => hasDescendantIn(child, paths));
}
