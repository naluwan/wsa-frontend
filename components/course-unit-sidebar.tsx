/**
 * CourseUnitSidebar 組件 - 課程學習頁的單元清單側邊欄
 * 顯示課程的章節和單元，可透過漢堡選單收合
 */
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  PlayCircle,
  Lock,
  CheckCircle2,
  Circle,
  FileText,
  ClipboardList,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { useSidebar } from "@/contexts/sidebar-context"

/**
 * 單元摘要型別（對應 LessonSummary）
 */
interface UnitSummary {
  id: number
  unitId: string  // 保持字串以兼容現有邏輯
  title: string
  type: string
  orderIndex: number
  sectionTitle: string
  chapterId: number  // 新增：章節 ID
  orderInSection: number
  isFreePreview: boolean
  canAccess: boolean
  isCompleted: boolean
}

/**
 * 章節型別
 */
interface Section {
  sectionTitle: string
  chapterId: number  // 新增：章節 ID
  orderIndex: number // 原始排序
  passwordRequired: boolean // 是否需要密碼
  units: UnitSummary[]
}

/**
 * 課程詳情型別（對應 Journey API 回應）
 */
interface CourseDetail {
  course: {
    code: string
    title: string
    isOwned?: boolean
  }
  sections: Section[]
}

interface CourseUnitSidebarProps {
  courseCode: string
  currentUnitId: string
}

/**
 * 渲染單元左側 icon（類型圖示）
 * - 無法存取（未購買的付費課程）→ 鎖 icon
 * - video → 播放 icon
 * - scroll → 文件 icon
 * - google-form → 表單 icon
 */
const renderUnitTypeIcon = (unit: UnitSummary, isActive: boolean) => {
  // 無法存取 → 顯示鎖
  if (!unit.canAccess) {
    return <Lock className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-white" : "text-muted-foreground")} />
  }

  // 根據 type 顯示不同 icon
  switch (unit.type) {
    case 'video':
      return <PlayCircle className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-white" : "text-foreground")} />
    case 'scroll':
      return <FileText className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-white" : "text-foreground")} />
    case 'google-form':
      return <ClipboardList className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-white" : "text-foreground")} />
    default:
      return <PlayCircle className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-white" : "text-foreground")} />
  }
}

/**
 * 渲染單元右側 icon（完成狀態）
 */
const renderUnitStatusIcon = (unit: UnitSummary, isActive: boolean) => {
  if (unit.isCompleted) {
    // 已完成：實心打勾圈圈
    return <CheckCircle2 className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-white" : "text-green-500")} />
  }
  // 未完成：虛線圈圈
  return <Circle className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-white/50" : "text-muted-foreground/50")} strokeDasharray="3 3" />
}

/**
 * SidebarContent 組件 - 提取為獨立組件並使用 memo 優化
 */
interface SidebarContentProps {
  showCollapsed?: boolean
  onLogoClick?: () => void
  loading: boolean
  courseDetail: CourseDetail | null
  currentUnitId: string
  onUnitClick: (unit: UnitSummary) => void
}

const SidebarContent = React.memo(({
  showCollapsed = false,
  onLogoClick,
  loading,
  courseDetail,
  currentUnitId,
  onUnitClick,
}: SidebarContentProps) => (
  <>
    {/* Logo 區域 */}
    <div className="flex h-16 items-center justify-between px-4">
      {!showCollapsed ? (
        <Link
          href="/"
          className="flex items-center gap-2"
          {...(onLogoClick && { onClick: onLogoClick })}
        >
          <Image
            src="/images/logo.png"
            alt="水球軟體學院"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <div>
            <div className="text-xs font-semibold">水球軟體學院</div>
            <div className="text-[10px] text-muted-foreground">WATERBALLSA.TW</div>
          </div>
        </Link>
      ) : (
        <Link
          href="/"
          className="mx-auto"
          {...(onLogoClick && { onClick: onLogoClick })}
        >
          <Image
            src="/images/logo.png"
            alt="水球軟體學院"
            width={32}
            height={32}
            className="rounded-lg"
          />
        </Link>
      )}
    </div>

    {/* 課程標題與單元列表 */}
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">載入中...</p>
        </div>
      ) : courseDetail ? (
        <>
          {/* 單元列表 */}
          <div className="flex-1 overflow-y-auto">
            {!showCollapsed ? (
              <Accordion
                type="multiple"
                defaultValue={courseDetail.sections.map((_, idx) => `section-${idx}`)}
                className="px-2 py-2"
              >
                {courseDetail.sections.map((section, sectionIndex) => (
                  <AccordionItem
                    key={`section-${sectionIndex}`}
                    value={`section-${sectionIndex}`}
                    className="border-b-0"
                  >
                    <AccordionTrigger className="text-xs font-semibold hover:no-underline py-4">
                      <span className="line-clamp-1">{section.sectionTitle}</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1">
                        {section.units.map((unit) => {
                          const isActive = unit.unitId === currentUnitId

                          return (
                            <button
                              key={unit.id}
                              onClick={() => onUnitClick(unit)}
                              className={cn(
                                "w-full text-left px-[10px] py-[0.75rem] rounded-[20px] flex items-start gap-[10px] transition-colors",
                                isActive
                                  ? "bg-yellow-600 text-white font-medium"
                                  : "hover:bg-muted"
                              )}
                              data-testid="unit-list-item"
                            >
                              {/* 左側類型圖示 */}
                              <div className="pt-[2px]">
                                {renderUnitTypeIcon(unit, isActive)}
                              </div>
                              {/* 標題（允許換行） */}
                              <span className={cn(
                                "text-sm flex-1 min-w-0 leading-relaxed",
                                isActive ? "font-medium" : ""
                              )}
                              data-testid="unit-title"
                              >
                                {unit.title}
                              </span>
                              {/* 右側完成狀態圖示 */}
                              <div className="pt-[2px]">
                                {renderUnitStatusIcon(unit, isActive)}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              // 收合時顯示簡化的圖示列表
              <div className="flex flex-col items-center gap-2 p-2">
                {courseDetail.sections.flatMap((section) =>
                  section.units.map((unit) => {
                    const isActive = unit.unitId === currentUnitId
                    return (
                      <button
                        key={unit.id}
                        onClick={() => onUnitClick(unit)}
                        className={cn(
                          "w-10 h-10 rounded-md flex items-center justify-center transition-colors",
                          isActive
                            ? "bg-yellow-600 text-white"
                            : "hover:bg-muted"
                        )}
                        title={unit.title}
                        data-testid="unit-list-item-collapsed"
                      >
                        {renderUnitTypeIcon(unit, isActive)}
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">載入失敗</p>
        </div>
      )}
    </div>
  </>
))

export function CourseUnitSidebar({
  courseCode,
  currentUnitId,
}: CourseUnitSidebarProps) {
  const router = useRouter()
  const { isCollapsed, setIsCollapsed } = useSidebar()
  const [courseDetail, setCourseDetail] = React.useState<CourseDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [isMobile, setIsMobile] = React.useState(false)

  // 載入課程詳情（使用 Journey API）
  React.useEffect(() => {
    if (!courseCode) return

    async function fetchCourseDetail() {
      try {
        setLoading(true)

        // 同時取得 journey 詳情、chapters 和使用者進度
        const [journeyRes, chaptersRes, progressRes] = await Promise.all([
          fetch(`/api/journeys/${courseCode}`),
          fetch(`/api/journeys/${courseCode}/chapters`),
          fetch(`/api/journeys/${courseCode}/progress`)
        ])

        // 取得已完成的 lesson IDs
        let completedLessonIds: number[] = []
        if (progressRes.ok) {
          const progressData = await progressRes.json()
          completedLessonIds = progressData.completedLessonIds || []
        }

        if (journeyRes.ok && chaptersRes.ok) {
          const journey = await journeyRes.json()
          const chapters = await chaptersRes.json()

          // 過濾章節：
          // 1. 隱藏需要密碼的章節（passwordRequired: true）- 副本七
          // 2. 隱藏只有單一 lesson 且無免費內容的章節 - 副本六
          // 並調整排序（「課程介紹＆試聽」排到最前面）
          const filteredChapters = chapters
            .filter((chapter: any) => {
              // 隱藏需要密碼的章節（副本七）
              if (chapter.passwordRequired) return false

              const lessons = chapter.lessons || []
              const hasFreeLesson = lessons.some((lesson: any) => !lesson.premiumOnly)

              // 如果有免費 lesson，顯示該章節
              if (hasFreeLesson) return true

              // 如果只有 1 個 lesson 且都是付費的，隱藏該章節（副本六）
              if (lessons.length <= 1) return false

              // 其他情況（有多個付費 lesson），顯示該章節
              return true
            })
            .map((chapter: any) => ({
              ...chapter,
              // 「課程介紹＆試聽」章節放到最前面（假設名稱包含「試聽」或「介紹」）
              sortOrder: chapter.name.includes('試聽') || chapter.name.includes('介紹') ? -1 : chapter.orderIndex
            }))
            .sort((a: any, b: any) => a.sortOrder - b.sortOrder)

          // 判斷使用者是否已購買此旅程
          const isOwned = journey.isOwned ?? false

          // 轉換為 CourseDetail 格式
          const courseDetail: CourseDetail = {
            course: {
              code: journey.slug,
              title: journey.name,
              isOwned: isOwned,
            },
            sections: filteredChapters.map((chapter: any) => ({
              sectionTitle: chapter.name,
              chapterId: chapter.id,
              orderIndex: chapter.orderIndex,
              passwordRequired: chapter.passwordRequired,
              units: chapter.lessons.map((lesson: any) => ({
                id: lesson.id,
                unitId: String(lesson.id),
                title: lesson.name,
                type: lesson.type,
                orderIndex: lesson.orderIndex,
                sectionTitle: chapter.name,
                chapterId: chapter.id,
                orderInSection: lesson.orderIndex,
                isFreePreview: !lesson.premiumOnly,
                // 已購買 → 全部可存取；未購買 → 只有免費課程可存取
                canAccess: isOwned || !lesson.premiumOnly,
                isCompleted: completedLessonIds.includes(lesson.id),
              }))
            }))
          }

          setCourseDetail(courseDetail)
        }
      } catch (error) {
        console.error('載入課程詳情失敗:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCourseDetail()

    // 監聽單元完成事件，重新載入課程詳情以更新已完成狀態
    const handleUnitCompleted = () => {
      console.log('[CourseUnitSidebar] 收到單元完成事件，重新載入課程詳情')
      fetchCourseDetail()
    }

    window.addEventListener('userXpUpdated', handleUnitCompleted)

    return () => {
      window.removeEventListener('userXpUpdated', handleUnitCompleted)
    }
  }, [courseCode])

  // 檢測是否為手機版
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  /**
   * 處理單元點擊
   */
  const handleUnitClick = React.useCallback((unit: UnitSummary) => {
    // URL 格式：/journeys/{slug}/chapters/{chapterId}/missions/{lessonId}
    router.push(`/journeys/${courseCode}/chapters/${unit.chapterId}/missions/${unit.unitId}`)
  }, [router, courseCode])

  /**
   * 處理 Logo 點擊（手機版關閉 Sheet）
   */
  const handleLogoClick = React.useCallback(() => {
    setIsCollapsed(true)
  }, [setIsCollapsed])

  return (
    <>
      {/* 桌面版：固定 Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-background border-r transition-all duration-300 z-40 w-[300px]",
          "hidden md:block", // 手機版隱藏，桌面版顯示
          isCollapsed && "-translate-x-full"
        )}
      >
        <SidebarContent
          showCollapsed={isCollapsed}
          loading={loading}
          courseDetail={courseDetail}
          currentUnitId={currentUnitId}
          onUnitClick={handleUnitClick}
        />
      </aside>

      {/* 手機版：Sheet（只在手機版渲染）*/}
      {isMobile && (
        <Sheet open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
          <SheetContent side="left" className="w-[300px] p-0">
            <SidebarContent
              showCollapsed={false}
              onLogoClick={handleLogoClick}
              loading={loading}
              courseDetail={courseDetail}
              currentUnitId={currentUnitId}
              onUnitClick={handleUnitClick}
            />
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}
