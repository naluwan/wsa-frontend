/**
 * 課程學習頁（Journey Player Page）
 *
 * 功能：
 * - 左側：課程單元清單 Sidebar（可收合，包含 Logo）
 * - 右側：全屏播放器（自訂控制列）
 * - 頂部：SiteHeader（包含通知、頭像等，來自 Root Layout）
 * - 支援試看單元、未購買鎖定提示、完成單元與 XP 更新
 * - 使用與首頁相同的 layout 結構
 *
 * 路由：/journeys/[courseCode]/missions/[unitId]
 */
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Lock, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { CourseUnitSidebar } from "@/components/course-unit-sidebar"
import { YoutubePlayer } from "@/components/youtube-player"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/contexts/sidebar-context"

/**
 * 單元詳情型別
 */
interface UnitDetail {
  id: string
  unitId: string
  courseCode: string
  courseTitle: string
  title: string
  type: string
  videoUrl: string
  xpReward: number
  isFreePreview: boolean
  canAccess: boolean
  isCompleted: boolean
  lastPositionSeconds?: number
}

/**
 * 完成單元回應型別
 */
interface CompleteUnitResponse {
  user: {
    id: string
    level: number
    totalXp: number
    weeklyXp: number
  }
  unit: {
    unitId: string
    isCompleted: boolean
    xpEarned: number
  }
}

export default function JourneyPlayerPage() {
  const router = useRouter()
  const { toast } = useToast()
  const params = useParams()
  const { isCollapsed } = useSidebar()

  // 解析 URL 參數
  const courseCode = params.courseCode as string
  const unitId = params.unitId as string

  // 資料狀態
  const [currentUnit, setCurrentUnit] = useState<UnitDetail | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // UI 狀態
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false)
  const [completing, setCompleting] = useState<boolean>(false)
  const [showCouponAlert, setShowCouponAlert] = useState<boolean>(true)

  // 進度追蹤狀態（使用 ref 儲存即時進度，避免頻繁重新渲染）
  const currentSecondsRef = useRef<number>(0)
  const durationSecondsRef = useRef<number>(0)

  // 只在需要顯示時才更新的進度百分比（減少重新渲染）
  const [progressPercent, setProgressPercent] = useState<number>(0)
  const [lastSavedPosition, setLastSavedPosition] = useState<number>(0)
  const lastSaveTimeRef = useRef<number>(0)
  const lastPercentUpdateRef = useRef<number>(0)


  // 載入當前單元詳情
  useEffect(() => {
    if (!unitId) return

    async function fetchUnitDetail() {
      try {
        setLoading(true)
        const res = await fetch(`/api/units/${unitId}`)
        if (res.ok) {
          const data: UnitDetail = await res.json()
          setCurrentUnit(data)

          // 設定上次觀看位置
          if (data.lastPositionSeconds) {
            setLastSavedPosition(data.lastPositionSeconds)
          }
        }
      } catch (error) {
        console.error('載入單元詳情失敗:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchUnitDetail()
  }, [unitId])

  /**
   * 處理完成單元
   */
  const handleCompleteUnit = async () => {
    if (!currentUnit || completing) return

    try {
      setCompleting(true)
      const res = await fetch(`/api/units/${currentUnit.unitId}/complete`, {
        method: 'POST',
      })

      if (res.ok) {
        const data: CompleteUnitResponse = await res.json()

        // 顯示 toast 通知
        toast({
          title: "單元已完成！",
          description: `獲得 ${data.unit.xpEarned} XP`,
        })

        // 更新當前單元狀態
        setCurrentUnit(prev => prev ? {
          ...prev,
          isCompleted: true,
        } : null)

        // 觸發自定義事件，通知 SiteHeader 和 Sidebar 更新資料
        window.dispatchEvent(new Event('userXpUpdated'))
      } else if (res.status === 401) {
        toast({
          title: "請先登入",
          description: "完成單元需要登入帳號",
          variant: "destructive",
        })
      } else {
        toast({
          title: "完成失敗",
          description: "無法完成此單元，請稍後再試",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('完成單元失敗:', error)
      toast({
        title: "發生錯誤",
        description: "請稍後再試",
        variant: "destructive",
      })
    } finally {
      setCompleting(false)
    }
  }


  /**
   * 處理播放進度（使用 ref 避免頻繁重新渲染）
   */
  const handleProgress = (seconds: number, duration: number) => {
    // 使用 ref 儲存即時進度（不觸發重新渲染）
    currentSecondsRef.current = seconds
    durationSecondsRef.current = duration

    const now = Date.now()

    // 每 2 秒更新一次進度百分比（用於顯示）
    if (now - lastPercentUpdateRef.current >= 2000) {
      const percent = duration > 0 ? (seconds / duration) * 100 : 0
      setProgressPercent(percent)
      lastPercentUpdateRef.current = now
    }

    // 每 5 秒保存一次進度
    if (now - lastSaveTimeRef.current >= 5000) {
      saveProgress(seconds)
      lastSaveTimeRef.current = now
    }
  }

  /**
   * 保存觀看進度到後端
   */
  const saveProgress = async (position: number) => {
    if (!currentUnit) return

    try {
      await fetch(`/api/user/progress/${currentUnit.unitId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastPositionSeconds: Math.floor(position) }),
      })
      // 不更新 lastSavedPosition state，避免觸發播放器重新初始化
    } catch (error) {
      console.error('保存進度失敗:', error)
    }
  }

  /**
   * 處理影片結束
   */
  const handleVideoEnded = () => {
    // 影片結束時，可以自動標記為完成（可選）
    console.log('影片播放結束')
  }

  /**
   * 從 YouTube URL 提取 Video ID
   */
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null
    try {
      const urlObj = new URL(url)

      // 處理 youtu.be 短網址
      if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.slice(1) // 移除開頭的 /
      }

      // 處理標準 YouTube URL
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v')
      }

      return null
    } catch {
      return null
    }
  }

  // 調試：在載入完成後輸出單元資訊
  useEffect(() => {
    if (currentUnit) {
      console.log('=== 當前單元資訊 ===')
      console.log('單元 ID:', currentUnit.unitId)
      console.log('原始影片 URL:', currentUnit.videoUrl)
      console.log('Video ID:', getYouTubeVideoId(currentUnit.videoUrl))
      console.log('canAccess:', currentUnit.canAccess)
      console.log('==================')
    }
  }, [currentUnit])

  if (loading || !currentUnit) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">載入中...</p>
      </div>
    )
  }

  return (
    <>
      {/* 課程單元 Sidebar */}
      <CourseUnitSidebar
        courseCode={courseCode}
        currentUnitId={unitId}
      />

      {/* 主內容區（根據 sidebar 狀態調整左邊距）*/}
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          // 手機版：沒有左側 margin
          // 桌面版：根據 sidebar 狀態調整
          "ml-0",
          "md:ml-0",
          !isCollapsed && "md:ml-64"
        )}
      >
        {/* SiteHeader 已經在 Root Layout 中，高度為 16（64px）*/}
        <main className="min-h-screen pt-16">
          {/* 播放器區域（佔滿整個可視區域）*/}
          <div className="h-[calc(100vh-4rem)] bg-black relative flex flex-col">
            {currentUnit.canAccess ? (
              <>
                {/* 折價券提示 Alert（浮在播放器上方） */}
                {currentUnit.isFreePreview && showCouponAlert && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-3xl px-4">
                    <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                      <AlertDescription className="flex items-center justify-between text-yellow-800 dark:text-yellow-200">
                        <span>將此體驗課程的全部影片看完就可以獲得 3000 元課程折價券！</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-2 hover:bg-yellow-100 dark:hover:bg-yellow-800"
                          onClick={() => setShowCouponAlert(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* YouTube 播放器（使用 YoutubePlayer 組件） */}
                <div className="relative w-full flex-1 bg-black">
                  {currentUnit.videoUrl && getYouTubeVideoId(currentUnit.videoUrl) ? (
                    <YoutubePlayer
                      videoId={getYouTubeVideoId(currentUnit.videoUrl)!}
                      onProgress={handleProgress}
                      onEnded={handleVideoEnded}
                      initialPosition={lastSavedPosition}
                    />
                  ) : (
                    <div className="text-white text-center flex items-center justify-center h-full">
                      <div>
                        <p>找不到影片 URL</p>
                        <p className="text-sm text-gray-400 mt-2">請確認課程單元設定</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 交付按鈕（固定在右下角，往上移一些） */}
                <div className="absolute bottom-20 right-8 z-20">
                  <Button
                    onClick={handleCompleteUnit}
                    disabled={
                      completing ||
                      currentUnit.isCompleted ||
                      progressPercent < 95
                    }
                    size="lg"
                    className="bg-yellow-600 hover:bg-yellow-700 text-black shadow-lg"
                    data-testid="complete-unit-button"
                  >
                    {currentUnit.isCompleted
                      ? '已完成'
                      : completing
                      ? '處理中...'
                      : progressPercent < 95
                      ? `觀看進度 ${Math.floor(progressPercent)}%`
                      : '交付課程'
                    }
                  </Button>
                </div>
              </>
            ) : (
              // 無權限：顯示鎖定提示
              <div className="flex items-center justify-center h-full bg-background">
                <Card className="p-8 text-center max-w-md">
                  <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h2 className="text-2xl font-bold mb-2">
                    您無法觀看「{currentUnit.title}」
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    這是課程「{currentUnit.courseTitle}」購買後才能享有的內容。
                  </p>
                  <Button asChild size="lg" className="bg-yellow-600 hover:bg-yellow-700 text-black">
                    <a href={`/courses/${courseCode}`}>
                      前往課程頁購買
                    </a>
                  </Button>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 登入提示 Dialog */}
      <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>需要先登入</AlertDialogTitle>
            <AlertDialogDescription>
              請先登入帳號才能試看課程或觀看單元內容。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>稍後再說</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const currentPath = window.location.pathname
                router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`)
              }}
            >
              前往登入
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
