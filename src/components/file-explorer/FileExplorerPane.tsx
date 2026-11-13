import { useCallback, useEffect, useState } from "react";
import type { FileEntry } from "../../types";
import CollapsiblePane from "../CollapsiblePane";
import TreeNode from "./TreeNode";
import styles from "./FileExplorer.module.css";

interface ContextMenuState {
  x: number;
  y: number;
  path: string;
  isDir: boolean;
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

export default function FileExplorerPane(props: FileExplorerProps) {
  return (
    <CollapsiblePane title="Explorer" side="left" defaultWidth={260}>
      <FileExplorer {...props} />
    </CollapsiblePane>
  );
}

function FileExplorer({ fileTree, graphPaths, selectedPath, dependencyPaths, dependentPaths, isPathExcluded, onSelectFile, onToggleExclude }: FileExplorerProps) {
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
        <div className={styles.empty}>No project loaded</div>
      </div>
    );
  }

  const excluded = contextMenu ? isPathExcluded(contextMenu.path) : false;

  return (
    <div className={styles.explorer}>
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
