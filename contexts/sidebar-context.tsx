/**
 * Sidebar Context - 管理課程學習頁的 Sidebar 狀態
 * 用於在 SiteHeader 和 CourseUnitSidebar 之間共享狀態
 */
"use client"

import * as React from "react"

interface SidebarContextType {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // 初始值設為 true（預設關閉），避免手機版 Sheet 閃現
  const [isCollapsed, setIsCollapsed] = React.useState(true)

  // 在 client side 檢測螢幕尺寸，設定初始狀態
  React.useEffect(() => {
    // 檢查是否為桌面版（>=768px，對應 Tailwind 的 md）
    const mediaQuery = window.matchMedia('(min-width: 768px)')

    // 桌面版預設展開（false），手機版預設關閉（true）
    setIsCollapsed(!mediaQuery.matches)

    // 監聽螢幕尺寸變化
    const handler = (e: MediaQueryListEvent) => {
      setIsCollapsed(!e.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  const toggleSidebar = React.useCallback(() => {
    setIsCollapsed(prev => !prev)
  }, [])

  const value = React.useMemo(
    () => ({
      isCollapsed,
      setIsCollapsed,
      toggleSidebar,
    }),
    [isCollapsed, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider")
  }
  return context
}
