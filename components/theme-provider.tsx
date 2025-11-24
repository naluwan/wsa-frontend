/**
 * ThemeProvider 組件 - 主題切換提供者
 * 使用 next-themes 提供明暗主題切換功能
 * 必須在 layout.tsx 中包裹整個應用
 */
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
