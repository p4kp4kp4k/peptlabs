import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeColor = "cyan" | "green" | "blue" | "red" | "light-blue";

interface ThemeContextType {
  theme: ThemeColor;
  setTheme: (t: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: "cyan", setTheme: () => {} });

// Dark base vars shared by dark themes (reset when switching from light)
const darkBase: Record<string, string> = {
  "--background": "222 47% 2%",
  "--foreground": "210 40% 98%",
  "--card": "220 35% 5%",
  "--card-foreground": "210 40% 98%",
  "--popover": "220 35% 6%",
  "--popover-foreground": "210 40% 98%",
  "--secondary": "220 25% 8%",
  "--secondary-foreground": "215 20% 70%",
  "--muted": "220 20% 8%",
  "--muted-foreground": "215 16% 47%",
  "--destructive-foreground": "0 0% 100%",
  "--border": "220 15% 9%",
  "--input": "220 15% 9%",
  "--sidebar-background": "222 47% 2%",
  "--sidebar-foreground": "215 20% 60%",
  "--sidebar-accent": "220 25% 7%",
  "--sidebar-accent-foreground": "215 20% 85%",
  "--sidebar-border": "220 15% 7%",
};

const lightBase: Record<string, string> = {
  "--background": "0 0% 100%",
  "--foreground": "222 47% 11%",
  "--card": "0 0% 99%",
  "--card-foreground": "222 47% 11%",
  "--popover": "0 0% 100%",
  "--popover-foreground": "222 47% 11%",
  "--secondary": "220 14% 96%",
  "--secondary-foreground": "220 9% 46%",
  "--muted": "220 14% 96%",
  "--muted-foreground": "220 9% 46%",
  "--destructive-foreground": "0 0% 100%",
  "--border": "220 13% 91%",
  "--input": "220 13% 91%",
  "--sidebar-background": "0 0% 98%",
  "--sidebar-foreground": "220 9% 46%",
  "--sidebar-accent": "220 14% 96%",
  "--sidebar-accent-foreground": "222 47% 11%",
  "--sidebar-border": "220 13% 91%",
};

const themes: Record<ThemeColor, Record<string, string>> = {
  cyan: {
    ...darkBase,
    "--primary": "187 100% 50%",
    "--primary-foreground": "222 47% 2%",
    "--ring": "187 100% 50%",
    "--sidebar-primary": "187 100% 50%",
    "--sidebar-primary-foreground": "222 47% 2%",
    "--sidebar-ring": "187 100% 50%",
    "--glow-primary": "187 100% 50%",
    "--accent": "262 83% 58%",
    "--accent-foreground": "210 40% 98%",
    "--glow-accent": "262 83% 58%",
  },
  green: {
    ...darkBase,
    "--primary": "142 71% 45%",
    "--primary-foreground": "222 47% 2%",
    "--ring": "142 71% 45%",
    "--sidebar-primary": "142 71% 45%",
    "--sidebar-primary-foreground": "222 47% 2%",
    "--sidebar-ring": "142 71% 45%",
    "--glow-primary": "142 71% 45%",
    "--accent": "43 96% 56%",
    "--accent-foreground": "222 47% 2%",
    "--glow-accent": "43 96% 56%",
  },
  blue: {
    ...darkBase,
    "--primary": "217 91% 60%",
    "--primary-foreground": "222 47% 2%",
    "--ring": "217 91% 60%",
    "--sidebar-primary": "217 91% 60%",
    "--sidebar-primary-foreground": "222 47% 2%",
    "--sidebar-ring": "217 91% 60%",
    "--glow-primary": "217 91% 60%",
    "--accent": "330 81% 60%",
    "--accent-foreground": "210 40% 98%",
    "--glow-accent": "330 81% 60%",
  },
  red: {
    ...darkBase,
    "--primary": "0 84% 60%",
    "--primary-foreground": "0 0% 100%",
    "--ring": "0 84% 60%",
    "--sidebar-primary": "0 84% 60%",
    "--sidebar-primary-foreground": "0 0% 100%",
    "--sidebar-ring": "0 84% 60%",
    "--glow-primary": "0 84% 60%",
    "--accent": "25 95% 53%",
    "--accent-foreground": "222 47% 2%",
    "--glow-accent": "25 95% 53%",
  },
  "light-blue": {
    ...lightBase,
    "--primary": "217 91% 60%",
    "--primary-foreground": "0 0% 100%",
    "--ring": "217 91% 60%",
    "--sidebar-primary": "217 91% 60%",
    "--sidebar-primary-foreground": "0 0% 100%",
    "--sidebar-ring": "217 91% 60%",
    "--glow-primary": "217 91% 60%",
    "--accent": "187 100% 42%",
    "--accent-foreground": "0 0% 100%",
    "--glow-accent": "187 100% 42%",
    "--destructive": "0 84% 60%",
    "--warning": "38 92% 50%",
    "--warning-foreground": "222 47% 11%",
    "--success": "142 71% 45%",
    "--success-foreground": "0 0% 100%",
  },
};

export const themeOptions: { value: ThemeColor; label: string; colors: [string, string]; mode: "dark" | "light" }[] = [
  { value: "cyan", label: "Cyan + Roxo", colors: ["#00E5FF", "#7C3AED"], mode: "dark" },
  { value: "green", label: "Verde + Dourado", colors: ["#22C55E", "#EAB308"], mode: "dark" },
  { value: "blue", label: "Azul + Rosa", colors: ["#3B82F6", "#EC4899"], mode: "dark" },
  { value: "red", label: "Vermelho + Laranja", colors: ["#EF4444", "#F97316"], mode: "dark" },
  { value: "light-blue", label: "Claro Azul", colors: ["#3B82F6", "#06B6D4"], mode: "light" },
];

function applyTheme(theme: ThemeColor) {
  const vars = themes[theme];
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, val]) => root.style.setProperty(key, val));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeColor>(() => {
    const stored = localStorage.getItem("peptilab-theme") as string;
    if (stored && stored in themes) return stored as ThemeColor;
    return "cyan";
  });

  const setTheme = (t: ThemeColor) => {
    setThemeState(t);
    localStorage.setItem("peptilab-theme", t);
    applyTheme(t);
  };

  useEffect(() => {
    applyTheme(theme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeColor() {
  return useContext(ThemeContext);
}
