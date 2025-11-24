/**
 * DashboardLayout 組件 - Dashboard 佈局
 * 管理側邊欄的展開/收合狀態
 * 提供左側側邊欄 + 主內容區的佈局
 */
"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteFooter } from "@/components/site-footer"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode;
  isAuthenticated?: boolean;
}

export function DashboardLayout({ children, isAuthenticated = true }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="relative flex min-h-screen">
      {/* 側邊欄 */}
      <AppSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isAuthenticated={isAuthenticated}
      />

      {/* 主內容區（包含header和content） */}
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          // 手機版：沒有左側 margin
          // 桌面版：根據 sidebar 狀態調整
          "ml-0",
          "lg:ml-16",
          !isSidebarCollapsed && "lg:ml-64"
        )}
      >
        {/* 主內容 */}
        <main className="min-h-screen pt-16">{children}</main>
        <SiteFooter />
      </div>
    </div>
  )
}
