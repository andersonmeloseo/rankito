import { useState } from "react";

type ViewMode = "list" | "grid" | "table";

export const useViewMode = (storageKey: string, defaultMode: ViewMode = "table") => {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(storageKey);
    return (saved as ViewMode) || defaultMode;
  });

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(storageKey, mode);
  };

  return { viewMode, setViewMode };
};
