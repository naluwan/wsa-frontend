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
 * 單元摘要型別
 */
interface UnitSummary {
  id: string
  unitId: string
  title: string
  type: string
  orderIndex: number
  sectionTitle: string
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
  units: UnitSummary[]
}

/**
 * 課程詳情型別
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
 * 渲染單元 icon
 */
const renderUnitIcon = (unit: UnitSummary) => {
  if (unit.isCompleted) {
    return <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
  }
  if (!unit.canAccess) {
    return <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
  }
  return unit.isFreePreview ? (
    <PlayCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
  ) : (
    <PlayCircle className="h-5 w-5 text-foreground flex-shrink-0" />
  )
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
          {/* 課程標題 - 收合時不顯示 */}
          {!showCollapsed && (
            <div className="p-4">
              <h2 className="text-sm font-bold line-clamp-2">
                {courseDetail.course.title}
              </h2>
            </div>
          )}

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
                  >
                    <AccordionTrigger className="text-xs font-semibold hover:no-underline py-2">
                      <span className="line-clamp-1">{section.sectionTitle}</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 pt-1">
                        {section.units.map((unit) => {
                          const isActive = unit.unitId === currentUnitId

                          return (
                            <button
                              key={unit.id}
                              onClick={() => onUnitClick(unit)}
                              className={cn(
                                "w-full text-left px-2 py-2 rounded-md flex items-start gap-2 transition-colors",
                                isActive
                                  ? "bg-yellow-600 text-white"
                                  : "hover:bg-muted"
                              )}
                            >
                              {renderUnitIcon(unit)}
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  "text-xs line-clamp-2",
                                  isActive ? "font-semibold" : ""
                                )}>
                                  {unit.title}
                                </p>
                                <div className="flex gap-1 mt-1">
                                  {unit.isFreePreview && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-[10px] px-1 py-0"
                                    >
                                      試看
                                    </Badge>
                                  )}
                                  {unit.isCompleted && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-[10px] px-1 py-0"
                                    >
                                      已完成
                                    </Badge>
                                  )}
                                </div>
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
                      >
                        {renderUnitIcon(unit)}
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

  // 載入課程詳情
  React.useEffect(() => {
    if (!courseCode) return

    async function fetchCourseDetail() {
      try {
        setLoading(true)
        const res = await fetch(`/api/courses/${courseCode}`)
        if (res.ok) {
          const data: CourseDetail = await res.json()
          setCourseDetail(data)
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
    router.push(`/journeys/${courseCode}/missions/${unit.unitId}`)
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
          "fixed left-0 top-0 h-screen bg-background border-r transition-all duration-300 z-40 w-64",
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
          <SheetContent side="left" className="w-64 p-0">
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
