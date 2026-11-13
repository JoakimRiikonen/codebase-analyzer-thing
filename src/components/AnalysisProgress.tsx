import { useEffect, useState } from "react";
import type { AnalysisProgress as Progress, AnalysisStage } from "../types";
import styles from "./AnalysisProgress.module.css";

const STAGES: { id: AnalysisStage; label: string }[] = [
  { id: "starting", label: "Starting dependency-cruiser" },
  { id: "extracting", label: "Reading files and resolving imports" },
  { id: "analyzing", label: "Analyzing dependencies" },
  { id: "counting", label: "Counting lines" },
];

interface AnalysisProgressProps {
  progress: Progress | null;
}

export default function AnalysisProgress({ progress }: AnalysisProgressProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => setElapsed((Date.now() - start) / 1000), 100);
    return () => clearInterval(timer);
  }, []);

  const currentIndex = STAGES.findIndex((s) => s.id === (progress?.stage ?? "starting"));
  const fraction =
    progress?.done != null && progress.total ? progress.done / progress.total : null;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Analyzing project</h2>

      <div className={styles.track}>
        {fraction === null ? (
          <div className={styles.indeterminate} />
        ) : (
          <div className={styles.fill} style={{ width: `${fraction * 100}%` }} />
        )}
      </div>

      <ol className={styles.stages}>
        {STAGES.map((stage, i) => {
          const state = i < currentIndex ? "done" : i === currentIndex ? "active" : "pending";
          return (
            <li key={stage.id} className={styles[state]}>
              <span className={styles.marker}>{state === "done" ? "✓" : i + 1}</span>
              <span>{stage.label}</span>
              {state === "active" && progress?.total != null && (
                <span className={styles.count}>
                  {(progress.done ?? 0).toLocaleString()} / {progress.total.toLocaleString()}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <div className={styles.elapsed}>{elapsed.toFixed(1)}s elapsed</div>
    </div>
  );
}
