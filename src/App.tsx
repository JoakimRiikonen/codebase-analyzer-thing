import styles from "./App.module.css";
import AnalysisProgress from "./components/AnalysisProgress";
import FileExplorerPane from "./components/file-explorer/FileExplorerPane";
import GraphView from "./components/GraphView";
import DetailsPane from "./components/DetailsPane";
import Toolbar from "./components/Toolbar";
import { useGraphSelection } from "./hooks/useGraphSelection";
import { usePathExclusions } from "./hooks/usePathExclusions";
import { useProject } from "./hooks/useProject";
import { useViewSettings } from "./hooks/useViewSettings";

export default function App() {
  const project = useProject();
  const { settings, updateSettings } = useViewSettings();
  const { isPathExcluded, toggleExclusion, filteredGraph, graphPaths } = usePathExclusions(
    project.graph,
  );
  const { selectedNode, setSelectedNode, selectByPath, dependencyPaths, dependentPaths } =
    useGraphSelection(project.graph, filteredGraph);

  return (
    <div className={styles.app}>
      <Toolbar
        projectPath={project.projectPath}
        loading={project.loading}
        settings={settings}
        availableExtensions={project.availableExtensions}
        onOpenProject={project.openProject}
        onSettingsChange={updateSettings}
      />
      <div className={styles.mainContent}>
        <FileExplorerPane
          fileTree={project.fileTree}
          graphPaths={graphPaths}
          selectedPath={selectedNode?.id ?? null}
          dependencyPaths={dependencyPaths}
          dependentPaths={dependentPaths}
          isPathExcluded={isPathExcluded}
          onSelectFile={selectByPath}
          onToggleExclude={toggleExclusion}
        />
        <div className={styles.graphPanel}>
          {project.error && (
            <div className={styles.errorBanner}>
              <p>{project.error}</p>
              <button onClick={project.dismissError}>Dismiss</button>
            </div>
          )}
          {!project.graph && !project.loading && !project.error && (
            <div className={styles.emptyState}>
              <h2>No project loaded</h2>
              <p>Click "Open Project" to select a TypeScript project folder.</p>
            </div>
          )}
          {project.loading && (
            <div className={styles.emptyState}>
              <AnalysisProgress progress={project.progress} />
            </div>
          )}
          <GraphView
            graph={filteredGraph}
            settings={settings}
            selectedNodeId={selectedNode?.id ?? null}
            onSelectNode={setSelectedNode}
          />
        </div>
        <DetailsPane graph={filteredGraph} selectedNode={selectedNode} onSelectPath={selectByPath} />
      </div>
    </div>
  );
}
