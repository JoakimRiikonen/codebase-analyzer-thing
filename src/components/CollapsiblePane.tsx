import { useCallback, useState, type PointerEvent, type ReactNode } from "react";
import styles from "./CollapsiblePane.module.css";

const MIN_WIDTH = 160;
const MAX_WIDTH = 600;

interface CollapsiblePaneProps {
  title: string;
  side: "left" | "right";
  defaultWidth: number;
  collapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export default function CollapsiblePane({
  title,
  side,
  defaultWidth,
  collapsed,
  onToggle,
  children,
}: CollapsiblePaneProps) {
  const [width, setWidth] = useState(defaultWidth);
  const sideClass = side === "left" ? styles.left : styles.right;

  const handleResizeStart = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = width;
      // Left pane grows when dragging right, right pane grows when dragging left
      const direction = side === "left" ? 1 : -1;

      const onMove = (ev: globalThis.PointerEvent) => {
        const next = startWidth + direction * (ev.clientX - startX);
        setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, next)));
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        document.body.classList.remove(styles.resizing);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      document.body.classList.add(styles.resizing);
    },
    [width, side],
  );
  // Chevron points in the direction the pane will move when toggled
  const pointsLeft = side === "left" ? !collapsed : collapsed;

  if (collapsed) {
    return (
      <button
        className={`${styles.collapsed} ${sideClass}`}
        onClick={onToggle}
        title={`Show ${title}`}
        aria-label={`Show ${title}`}
      >
        <span className={styles.chevron}>{pointsLeft ? "‹" : "›"}</span>
        <span className={styles.verticalTitle}>{title}</span>
      </button>
    );
  }

  return (
    <div className={`${styles.pane} ${sideClass}`} style={{ width }}>
      <button
        className={styles.header}
        onClick={onToggle}
        title={`Hide ${title}`}
        aria-label={`Hide ${title}`}
      >
        <span>{title}</span>
        <span className={styles.toggle}>{pointsLeft ? "‹" : "›"}</span>
      </button>
      <div className={styles.body}>{children}</div>
      <div className={styles.resizeHandle} onPointerDown={handleResizeStart} />
    </div>
  );
}
