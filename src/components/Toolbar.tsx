import type { LayoutName, ViewSettings } from "../types";
import styles from "./Toolbar.module.css";

const LAYOUTS: { value: LayoutName; label: string }[] = [
  { value: "cose", label: "Force-Directed" },
  { value: "breadthfirst", label: "Hierarchical" },
  { value: "circle", label: "Circle" },
  { value: "grid", label: "Grid" },
];

interface ToolbarProps {
  projectPath: string | null;
  loading: boolean;
  settings: ViewSettings;
  availableExtensions: string[];
  onOpenProject: () => void;
  onSettingsChange: (changes: Partial<ViewSettings>) => void;
}

export default function Toolbar({
  projectPath,
  loading,
  settings,
  availableExtensions,
  onOpenProject,
  onSettingsChange,
}: ToolbarProps) {
  const toggleExtension = (ext: string) => {
    const next = new Set(settings.hiddenExtensions);
    if (next.has(ext)) next.delete(ext);
    else next.add(ext);
    onSettingsChange({ hiddenExtensions: next });
  };

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
            checked={settings.showFullPath}
            onChange={() => onSettingsChange({ showFullPath: !settings.showFullPath })}
          />
          Full paths
        </label>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={settings.showExternal}
            onChange={() => onSettingsChange({ showExternal: !settings.showExternal })}
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
                  checked={!settings.hiddenExtensions.has(ext)}
                  onChange={() => toggleExtension(ext)}
                />
                .{ext}
              </label>
            ))}
          </div>
        )}
        <select
          className={styles.layoutSelect}
          value={settings.layout}
          onChange={(e) => onSettingsChange({ layout: e.target.value as LayoutName })}
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
