export interface ChartTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    grid: string;
  };
  gradient: {
    start: number;
    end: number;
  };
}

export const chartThemes: Record<string, ChartTheme> = {
  moderno: {
    name: "Moderno",
    colors: {
      primary: "#8b5cf6",
      secondary: "#3b82f6",
      accent: "#10b981",
      background: "#ffffff",
      text: "#1f2937",
      grid: "#e5e7eb",
    },
    gradient: {
      start: 0.8,
      end: 0,
    },
  },
  minimalista: {
    name: "Minimalista",
    colors: {
      primary: "#64748b",
      secondary: "#94a3b8",
      accent: "#475569",
      background: "#ffffff",
      text: "#0f172a",
      grid: "#f1f5f9",
    },
    gradient: {
      start: 0.3,
      end: 0,
    },
  },
  corporativo: {
    name: "Corporativo",
    colors: {
      primary: "#1e40af",
      secondary: "#059669",
      accent: "#dc2626",
      background: "#f9fafb",
      text: "#111827",
      grid: "#d1d5db",
    },
    gradient: {
      start: 0.5,
      end: 0,
    },
  },
  vibrante: {
    name: "Vibrante",
    colors: {
      primary: "#ec4899",
      secondary: "#f59e0b",
      accent: "#8b5cf6",
      background: "#fafafa",
      text: "#18181b",
      grid: "#e4e4e7",
    },
    gradient: {
      start: 0.9,
      end: 0.1,
    },
  },
};

export const getThemeColors = (theme: string, customColors?: Partial<ChartTheme['colors']>) => {
  const baseTheme = chartThemes[theme] || chartThemes.moderno;
  return {
    ...baseTheme.colors,
    ...customColors,
  };
};
