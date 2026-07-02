"use client";

import React, { useEffect } from "react";
import { useTheme } from "next-themes";
import { themeFromSourceColor, applyTheme, argbFromHex } from "@material/material-color-utilities";

export interface MaterialThemeProviderProps {
  children: React.ReactNode;
  sourceColor?: string;
}

export function MaterialThemeProvider({
  children,
  sourceColor = "#00D1FF", // NAUTILUS Brand Cyan
}: MaterialThemeProviderProps) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Generate the theme
    const theme = themeFromSourceColor(argbFromHex(sourceColor));
    const isDark = resolvedTheme === "dark";
    
    // Apply theme to body (sets --md-sys-color-* variables)
    applyTheme(theme, { target: document.body, dark: isDark });
  }, [sourceColor, resolvedTheme]);

  return <>{children}</>;
}
