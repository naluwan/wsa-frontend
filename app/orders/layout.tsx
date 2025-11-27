/**
 * 訂單流程專用 Layout
 * 特點：
 * - 沒有 sidebar
 * - 只有左上角的 logo 和品牌名稱
 * - 深色背景全螢幕結帳體驗
 */

import Link from "next/link"
import Image from "next/image"

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* 頂部 Logo */}
      <header className="p-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <Image
            src="/images/logo.png"
            alt="水球軟體學院"
            width={32}
            height={32}
            className="rounded"
          />
          <div className="text-white">
            <div className="text-sm font-bold">水球軟體學院</div>
            <div className="text-xs text-slate-400">WATERBALLSA.TW</div>
          </div>
        </Link>
      </header>

      {/* 主要內容區 */}
      <main className="w-full px-4 pb-8">
        {children}
      </main>
    </div>
  )
}
