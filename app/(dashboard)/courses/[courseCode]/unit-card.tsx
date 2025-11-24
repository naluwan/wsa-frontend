"use client"

/**
 * 單元卡片（Unit Card）- Client Component
 * 處理單元的顯示與互動邏輯
 * - 顯示單元資訊（標題、類型、完成狀態）
 * - 處理「開始學習」按鈕點擊
 * - 檢查登入狀態（針對鎖定的單元）
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlayCircle, BookOpen, CheckCircle2, Circle, Lock, ArrowRight } from "lucide-react"
import { LoginDialog } from "./login-dialog"

interface UnitCardProps {
  unit: {
    id: string
    unitId: string
    title: string
    type: string
    orderIndex: number
    isCompleted: boolean
    sectionTitle: string
    orderInSection: number
    isFreePreview: boolean
    canAccess: boolean
  }
  isLoggedIn: boolean  // 是否已登入
}

/**
 * 根據單元類型取得圖示
 */
function getUnitIcon(type: string) {
  switch (type) {
    case "video":
      return PlayCircle
    default:
      return BookOpen
  }
}

export function UnitCard({ unit, isLoggedIn }: UnitCardProps) {
  const router = useRouter()
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const UnitIcon = getUnitIcon(unit.type)

  /**
   * 處理開始學習按鈕點擊
   * 如果未登入且單元不可存取，顯示登入對話框
   */
  const handleStartLearning = () => {
    console.log("[UnitCard] 點擊已鎖定單元:", {
      unitId: unit.unitId,
      isLoggedIn,
      canAccess: unit.canAccess
    })

    // 如果未登入且單元不可存取（非免費試看），顯示登入對話框
    if (!isLoggedIn && !unit.canAccess) {
      console.log("[UnitCard] 未登入且單元不可存取，顯示登入對話框")
      setShowLoginDialog(true)
      return
    }

    console.log("[UnitCard] 導向單元頁面")
    // 否則導向單元頁面
    router.push(`/units/${unit.unitId}`)
  }

  return (
    <>
      <Card
        className={`transition-shadow ${!unit.canAccess ? 'bg-muted/30' : 'hover:shadow-md'}`}
        data-testid="unit-card"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              {/* 完成狀態圖示 */}
              {unit.isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
              ) : unit.canAccess ? (
                <Circle className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
              )}

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <UnitIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground uppercase">
                    {unit.type === "video" ? "影片" : unit.type}
                  </span>
                  {unit.isFreePreview && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                      免費試看
                    </Badge>
                  )}
                </div>
                <CardTitle
                  className={`text-lg ${!unit.canAccess ? 'text-muted-foreground' : ''}`}
                  data-testid="unit-title"
                >
                  {unit.title}
                </CardTitle>
              </div>
            </div>

            {/* 按鈕區域 */}
            {unit.canAccess ? (
              // 可存取的單元：直接導向
              <Button
                asChild
                variant={unit.isCompleted ? "outline" : "default"}
                data-testid="enter-unit-button"
              >
                <Link href={`/units/${unit.unitId}`}>
                  {unit.isCompleted ? "重新觀看" : "開始學習"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              // 不可存取的單元：需要檢查登入
              <Button
                onClick={handleStartLearning}
                variant="outline"
                className="cursor-pointer"
                data-testid="locked-unit-button"
              >
                <Lock className="mr-2 h-4 w-4" />
                已鎖定
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* 登入提示對話框 */}
      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        returnUrl={`/units/${unit.unitId}`}
      />
    </>
  )
}
