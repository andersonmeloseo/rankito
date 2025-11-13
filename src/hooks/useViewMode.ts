import { useState, useEffect } from "react";
import { ViewMode } from "@/components/layout/ViewSwitcher";

export const useViewMode = (storageKey: string, defaultValue: ViewMode = "table") => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(storageKey);
    return (stored as ViewMode) || defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, viewMode);
  }, [viewMode, storageKey]);

  return [viewMode, setViewMode] as const;
};
