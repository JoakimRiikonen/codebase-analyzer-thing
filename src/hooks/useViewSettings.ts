import { useCallback, useState } from "react";
import type { ViewSettings } from "../types";

const DEFAULT_SETTINGS: ViewSettings = {
  layout: "cose",
  showFullPath: false,
  showExternal: true,
  hiddenExtensions: new Set(),
};

/** Toolbar view settings. `updateSettings` merges in only the fields that changed. */
export function useViewSettings() {
  const [settings, setSettings] = useState<ViewSettings>(DEFAULT_SETTINGS);

  const updateSettings = useCallback(
    (changes: Partial<ViewSettings>) => setSettings((prev) => ({ ...prev, ...changes })),
    [],
  );

  return { settings, updateSettings };
}
