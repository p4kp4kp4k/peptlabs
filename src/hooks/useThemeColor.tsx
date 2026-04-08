import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeColor = "cyan" | "green" | "blue" | "red";

interface ThemeContextType {
  theme: ThemeColor;
  setTheme: (t: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: "cyan", setTheme: () => {} });

const themes: Record<ThemeColor, Record<string, string>> = {
  cyan: {
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
};

export const themeOptions: { value: ThemeColor; label: string; colors: [string, string] }[] = [
  { value: "cyan", label: "Cyan + Roxo", colors: ["#00E5FF", "#7C3AED"] },
  { value: "green", label: "Verde + Dourado", colors: ["#22C55E", "#EAB308"] },
  { value: "blue", label: "Azul + Rosa", colors: ["#3B82F6", "#EC4899"] },
  { value: "red", label: "Vermelho + Laranja", colors: ["#EF4444", "#F97316"] },
];

function applyTheme(theme: ThemeColor) {
  const vars = themes[theme];
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, val]) => root.style.setProperty(key, val));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeColor>(() => {
    return (localStorage.getItem("peptilab-theme") as ThemeColor) || "cyan";
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
