import type { LayoutName } from "../types";
import styles from "./Toolbar.module.css";

const LAYOUTS: { value: LayoutName; label: string }[] = [
  { value: "cose", label: "Force-Directed" },
  { value: "breadthfirst", label: "Hierarchical" },
  { value: "circle", label: "Circle" },
  { value: "concentric", label: "Concentric" },
  { value: "grid", label: "Grid" },
];

interface ToolbarProps {
  projectPath: string | null;
  loading: boolean;
  layout: LayoutName;
  showFullPath: boolean;
  showExternal: boolean;
  availableExtensions: string[];
  hiddenExtensions: Set<string>;
  onOpenProject: () => void;
  onLayoutChange: (layout: LayoutName) => void;
  onToggleFullPath: () => void;
  onToggleExternal: () => void;
  onToggleExtension: (ext: string) => void;
}

export default function Toolbar({
  projectPath,
  loading,
  layout,
  showFullPath,
  showExternal,
  availableExtensions,
  hiddenExtensions,
  onOpenProject,
  onLayoutChange,
  onToggleFullPath,
  onToggleExternal,
  onToggleExtension,
}: ToolbarProps) {
  return (
    <header className={styles.toolbar}>
      <div className={styles.left}>
        <h1 className={styles.title}>Codebase Analyzer</h1>
        {projectPath && (
          <span className={styles.projectPath}>{projectPath}</span>
        )}
      </div>
      <div className={styles.right}>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={showFullPath}
            onChange={onToggleFullPath}
          />
          Full paths
        </label>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={showExternal}
            onChange={onToggleExternal}
          />
          External deps
        </label>
        {availableExtensions.length > 0 && (
          <div className={styles.extFilter}>
            <span className={styles.extFilterLabel}>Extensions:</span>
            {availableExtensions.map((ext) => (
              <label key={ext} className={styles.extToggle}>
                <input
                  type="checkbox"
                  checked={!hiddenExtensions.has(ext)}
                  onChange={() => onToggleExtension(ext)}
                />
                .{ext}
              </label>
            ))}
          </div>
        )}
        <select
          className={styles.layoutSelect}
          value={layout}
          onChange={(e) => onLayoutChange(e.target.value as LayoutName)}
        >
          {LAYOUTS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
        <button className={styles.btnPrimary} onClick={onOpenProject} disabled={loading}>
          {loading ? "Analyzing..." : "Open Project"}
        </button>
      </div>
    </header>
  );
}
