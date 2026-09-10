import { createContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem("app-theme");
    return storedTheme === "theme-5" ? "theme-default" : storedTheme || "theme-default";
  });

  useEffect(() => {
    localStorage.setItem("app-theme", theme);
    document.body.setAttribute("data-app-theme", theme);
    // Keep the app in light mode; OS dark preference must not invert UI
    document.documentElement.classList.remove("dark");
    document.body.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }, [theme]);

  // Themes configurations
  const themes = {
    "theme-default": {
      id: "theme-default",
      name: "Default Brand Theme",
      sidebar: "bg-[#1B3679] text-white border-white/10",
      topbar: "bg-white text-slate-800 border-slate-200",
      layout: "bg-slate-50 text-black",
    },
    "theme-1": {
      id: "theme-1",
      name: "Brand Blue & Red",
      sidebar: "bg-[#1B3679] text-white border-white/10", 
      topbar: "bg-[#C31230] text-white border-transparent",
      layout: "bg-slate-50 text-black",
    },
    "theme-2": {
      id: "theme-2",
      name: "Brand Red & Blue",
      sidebar: "bg-[#C31230] text-white border-white/10",
      topbar: "bg-[#1B3679] text-white border-transparent",
      layout: "bg-slate-50 text-black",
    },
    "theme-3": {
      id: "theme-3",
      name: "Brand Blue",
      sidebar: "bg-[#1B3679] text-white border-white/10",
      topbar: "bg-white text-slate-800 border-slate-200",
      layout: "bg-slate-50 text-black",
    },
    "theme-4": {
      id: "theme-4",
      name: "Brand Red",
      sidebar: "bg-[#C31230] text-white border-white/10",
      topbar: "bg-white text-slate-800 border-slate-200",
      layout: "bg-slate-50 text-black",
    },
    "theme-5": {
      id: "theme-5",
      name: "Light Operations",
      sidebar: "bg-[#1B3679] text-white border-white/10",
      topbar: "bg-white text-slate-800 border-slate-200",
      layout: "bg-slate-50 text-black",
    },
  };

  const currentThemeConfig = themes[theme] || themes["theme-default"];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes, currentThemeConfig }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
