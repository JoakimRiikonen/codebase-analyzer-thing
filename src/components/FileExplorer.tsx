import { useCallback, useEffect, useState } from "react";
import type { FileEntry } from "../types";
import styles from "./FileExplorer.module.css";

function hasDescendantIn(entry: FileEntry, paths: Set<string>): boolean {
  if (paths.has(entry.path)) return true;
  return entry.children.some((child) => hasDescendantIn(child, paths));
}

interface ContextMenuState {
  x: number;
  y: number;
  path: string;
  isDir: boolean;
}

interface TreeNodeProps {
  entry: FileEntry;
  depth: number;
  graphPaths: Set<string>;
  selectedPath: string | null;
  dependencyPaths: Set<string>;
  dependentPaths: Set<string>;
  isPathExcluded: (path: string) => boolean;
  onSelect: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, path: string, isDir: boolean) => void;
}

function TreeNode({ entry, depth, graphPaths, selectedPath, dependencyPaths, dependentPaths, isPathExcluded, onSelect, onContextMenu }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const inGraph = graphPaths.has(entry.path);
  const isActive = selectedPath === entry.path;
  const isDependency = entry.is_dir ? hasDescendantIn(entry, dependencyPaths) : dependencyPaths.has(entry.path);
  const isDependent = entry.is_dir ? hasDescendantIn(entry, dependentPaths) : dependentPaths.has(entry.path);
  const excluded = isPathExcluded(entry.path);

  if (entry.is_dir) {
    const dirClassNames = [
      styles.item,
      isDependency ? styles.dependency : "",
      isDependent ? styles.dependent : "",
      excluded ? styles.excluded : "",
    ].filter(Boolean).join(" ");

    return (
      <>
        <button
          className={dirClassNames}
          style={{ paddingLeft: 8 + depth * 14 }}
          onClick={() => setExpanded((v) => !v)}
          onContextMenu={(e) => onContextMenu(e, entry.path, true)}
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
              isPathExcluded={isPathExcluded}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
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
    excluded ? styles.excluded : "",
  ].filter(Boolean).join(" ");

  return (
    <button
      className={classNames}
      style={{ paddingLeft: 8 + depth * 14 + 18 }}
      onClick={() => onSelect(entry.path)}
      onContextMenu={(e) => onContextMenu(e, entry.path, false)}
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
  isPathExcluded: (path: string) => boolean;
  onSelectFile: (path: string) => void;
  onToggleExclude: (path: string) => void;
}

export default function FileExplorer({ fileTree, graphPaths, selectedPath, dependencyPaths, dependentPaths, isPathExcluded, onSelectFile, onToggleExclude }: FileExplorerProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent, path: string, isDir: boolean) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, path, isDir });
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu]);

  if (fileTree.length === 0) {
    return (
      <div className={styles.explorer}>
        <div className={styles.header}>Explorer</div>
        <div className={styles.empty}>No project loaded</div>
      </div>
    );
  }

  const excluded = contextMenu ? isPathExcluded(contextMenu.path) : false;

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
            isPathExcluded={isPathExcluded}
            onSelect={onSelectFile}
            onContextMenu={handleContextMenu}
          />
        ))}
      </div>
      {contextMenu && (
        <div
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className={styles.contextMenuItem}
            onClick={() => {
              onToggleExclude(contextMenu.path);
              setContextMenu(null);
            }}
          >
            {excluded
              ? `Include ${contextMenu.isDir ? "folder" : "file"}`
              : `Exclude ${contextMenu.isDir ? "folder" : "file"}`}
          </button>
        </div>
      )}
    </div>
  );
}
