/**
 * SOP 寶典頁面（Journey-Specific）
 * - 軟體設計模式：顯示「SOP 寶典」
 * - AI x BDD：顯示「Prompt 寶典」
 * - 顯示課程折價提示框（僅軟體設計模式）
 */
"use client"

import { useCourse } from "@/contexts/course-context"
import { CourseDiscountAlert } from "@/components/course-discount-alert"

interface SopPageProps {
  params: {
    slug: string
  }
}

export default function SopPage({ params }: SopPageProps) {
  const { currentCourse } = useCourse()

  // 根據 slug 決定標題
  const isAiBdd = params.slug === "ai-bdd"
  const title = isAiBdd ? "Prompt 寶典" : "SOP 寶典"
  const description = isAiBdd
    ? "AI 提示詞範本文件庫"
    : "標準作業程序文件庫"

  // 只有軟體設計模式才顯示折價提示框
  const showPromoAlert = currentCourse?.slug === "software-design-pattern"

  return (
    <div className="container mx-auto px-6 py-8">
      {/* 課程折價提示框（僅軟體設計模式顯示）*/}
      {showPromoAlert && <CourseDiscountAlert />}

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {/* TODO: 實作寶典文件列表 */}
      <div className="text-center py-12 text-muted-foreground">
        {title}功能開發中...
      </div>
    </div>
  )
}
