"use client";

import { useEffect } from "react";
import { useApp } from "@/context/AppContext";

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { settings } = useApp();

  useEffect(() => {
    const root = document.documentElement;
    const theme = settings.ui.theme;

    const apply = (isDark: boolean) => {
      root.classList.toggle("light", !isDark);
    };

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: light)");
      apply(!mq.matches);
      const handler = (e: MediaQueryListEvent) => apply(!e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else if (theme === "light") {
      apply(false);
    } else {
      apply(true);
    }
  }, [settings.ui.theme]);

  return <>{children}</>;
}
