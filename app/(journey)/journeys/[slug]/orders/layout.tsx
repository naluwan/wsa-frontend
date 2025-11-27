/**
 * 訂單頁面專用 Layout
 * 特點：
 * - 隱藏父層的 SiteHeader
 * - 只顯示左上角 Logo
 * - 深色背景全螢幕結帳體驗
 */

"use client"

import { useEffect } from "react"

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 隱藏父層的 SiteHeader（固定在頂部的 header）
  useEffect(() => {
    // 選擇固定在頂部的 header 元素
    const header = document.querySelector('header.fixed.top-0') as HTMLElement
    if (header) {
      header.style.display = 'none'
    }

    return () => {
      // 離開頁面時恢復顯示
      if (header) {
        header.style.display = ''
      }
    }
  }, [])

  return <>{children}</>
}
