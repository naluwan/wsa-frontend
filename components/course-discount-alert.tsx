/**
 * 課程折價提示框組件
 * 用於顯示「將軟體設計精通之旅體驗課程的全部影片看完就可以獲得 3000 元課程折價券！」
 * 僅當選擇軟體設計模式課程時顯示
 */
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CourseDiscountAlert() {
  return (
    <div className="flex flex-row items-center justify-between gap-4 mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
      <Link
        href="/journeys/software-design-pattern/chapters/8/missions/8001"
        className="text-foreground underline cursor-pointer flex-1"
      >
        將軟體設計精通之旅體驗課程的全部影片看完就可以獲得 3000
        元課程折價券！
      </Link>
      <Button
        asChild
        size="sm"
        variant="outline"
        className="border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white flex-shrink-0"
      >
        <Link href="/journeys/software-design-pattern/chapters/8/missions/8001">
          前往
        </Link>
      </Button>
    </div>
  )
}
