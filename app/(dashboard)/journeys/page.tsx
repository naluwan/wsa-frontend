/**
 * 單一課程章節/單元總覽頁（原 /units，現改為 /journeys）
 *
 * 功能：
 * - 依照在 /courses 選取的課程（currentCourse context），顯示該課程的詳細資訊
 * - 顯示課程介紹（標題、描述、講師、價格）
 * - 顯示可展開/收合的章節列表
 * - 每個章節底下列出 lessons 和 gyms
 * - 點擊 lesson 會導向 /journeys/{slug}/chapters/{chapterId}/missions/{lessonId}
 *
 * 資料來源（全部使用 Journey Domain API）：
 * - GET /api/journeys/{slug} - 取得課程詳情
 * - GET /api/journeys/{slug}/chapters - 取得章節列表（含 lessons 和 gyms）
 * - GET /api/auth/me - 檢查登入狀態
 *
 * 注意：
 * - 若沒有 currentCourse，代表使用者不是從 /courses 進來選課，
 *   此時會顯示提示訊息並引導回 /courses 課程列表頁。
 * - 這個頁面依賴 CourseContext 中的 currentCourse 狀態。
 */
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ChevronDown, ChevronRight, PlayCircle, FileText, Globe, Smartphone, Award } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useCourse } from "@/contexts/course-context"
import type { JourneyDetail, ChapterDetail, LessonSummary } from "@/types/journey"

/**
 * 課程描述配置
 */
const COURSE_DESCRIPTIONS: Record<string, { subtitle: string; paragraphs: string[] }> = {
  'software-design-pattern': {
    subtitle: '「用一趟旅程的時間，成為硬核的 Coding 高手。」',
    paragraphs: [
      '本課程從軟體抽象思維出發，透過將「無形變有形」來掌握高效率的迭代式設計思路。我們將採用 Christopher Alexander 的設計思想來解析設計模式，並提供由淺入深的題目及線上 Code Review 服務。',
      '只要你願意努力學習，我保證你能在數月內習得七年的進階軟體架構設計能力，透過三大複雜框架的鍛鍊，使你能獨立分析、設計及開發實戰框架。',
    ],
  },
  'ai-bdd': {
    subtitle: '「用半年的時間，徹底學會如何結合 TDD、BDD 與 AI，實現 100% 全自動化、高精準度的程式開發。」',
    paragraphs: [
      '這門課程要帶你掌握規格驅動開發，讓 AI 自動完成從測試到程式修正的一整套流程。上完課後，你不只是理解方法，更能真正把 AI 落實到專案裡，從此不再困在無止盡的 Debug 與 Review，而是成為團隊裡能制定規格與標準的工程師。',
      '在這趟學習過程中，你將透過影音課程、專屬社群、每週研討會與實戰演練，逐步掌握如何用規格驅動開發。本課程將每週陸續上架新單元，確保你能循序學習、穩定進步。',
    ],
  },
}

export default function JourneysPage() {
  const router = useRouter()
  const { currentCourse } = useCourse()
  const [journey, setJourney] = useState<JourneyDetail | null>(null)
  const [chapters, setChapters] = useState<ChapterDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set())
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [orders, setOrders] = useState<any[]>([])

  // 課程類型判斷
  const isSoftwareDesignPattern = currentCourse?.slug === 'software-design-pattern'
  const isAIxBDD = currentCourse?.slug === 'ai-bdd'

  // 檢查登入狀態
  useEffect(() => {
    async function checkLoginStatus() {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          setIsLoggedIn(!!data.user)
        } else {
          setIsLoggedIn(false)
        }
      } catch (error) {
        console.error('[JourneysPage] 檢查登入狀態失敗:', error)
        setIsLoggedIn(false)
      }
    }
    checkLoginStatus()
  }, [])

  // 根據登入狀態獲取使用者所有訂單（參考 courses 頁面邏輯）
  useEffect(() => {
    async function fetchOrders() {
      // 如果未登入，清空訂單列表
      if (!isLoggedIn) {
        setOrders([])
        return
      }

      try {
        const res = await fetch('/api/user/orders')
        if (res.ok) {
          const data = await res.json()
          console.log('[JourneysPage] 所有訂單:', data)
          setOrders(data)
        } else {
          console.error('[JourneysPage] 獲取訂單失敗:', res.status)
          setOrders([])
        }
      } catch (error) {
        console.error('[JourneysPage] 獲取訂單錯誤:', error)
        setOrders([])
      }
    }

    fetchOrders()
  }, [isLoggedIn])

  // 當課程變更時，獲取課程詳情和章節列表
  useEffect(() => {
    async function fetchJourneyData() {
      if (!currentCourse?.slug) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        // 並行獲取課程詳情、章節列表和待付款訂單
        const [journeyRes, chaptersRes] = await Promise.all([
          fetch(`/api/journeys/${currentCourse.slug}`),
          fetch(`/api/journeys/${currentCourse.slug}/chapters`),
        ])

        if (journeyRes.ok) {
          const journeyData: JourneyDetail = await journeyRes.json()
          console.log('[JourneysPage] 載入課程資料:', {
            name: journeyData.name,
            id: journeyData.id,
            slug: journeyData.slug,
            isOwned: journeyData.isOwned,
          })
          setJourney(journeyData)
        }

        if (chaptersRes.ok) {
          const chaptersData: ChapterDetail[] = await chaptersRes.json()
          setChapters(chaptersData)
          // 預設不展開任何章節（全部收合）
          setExpandedChapters(new Set())
        }
      } catch (error) {
        console.error('獲取課程資料失敗:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchJourneyData()
  }, [currentCourse?.slug, isLoggedIn])

  // 切換章節展開狀態
  const toggleChapter = (chapterId: number) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev)
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId)
      } else {
        newSet.add(chapterId)
      }
      return newSet
    })
  }

  // 處理 lesson 點擊
  const handleLessonClick = (chapterId: number, lessonId: number) => {
    if (!currentCourse?.slug) return
    router.push(`/journeys/${currentCourse.slug}/chapters/${chapterId}/missions/${lessonId}`)
  }

  // 取得 lesson 圖示
  const getLessonIcon = (type: LessonSummary['type']) => {
    switch (type) {
      case 'video':
        return <PlayCircle className="h-5 w-5 text-muted-foreground" />
      case 'scroll':
        return <FileText className="h-5 w-5 text-muted-foreground" />
      case 'google-form':
        return <FileText className="h-5 w-5 text-muted-foreground" />
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />
    }
  }

  // 過濾和排序章節
  const filteredChapters = chapters.filter((chapter) => {
    // AI x BDD：不顯示課程介紹 & 試聽
    if (isAIxBDD) {
      if (chapter.name.includes("課程介紹") || chapter.name.includes("試聽")) {
        return false
      }
    }
    // 軟體設計模式：不顯示副本六和副本七
    if (isSoftwareDesignPattern) {
      if (chapter.name.includes("副本六") || chapter.name.includes("副本七")) {
        return false
      }
    }
    return true
  }).sort((a, b) => {
    // 軟體設計模式：把課程介紹 & 試聽移到最上方
    if (isSoftwareDesignPattern) {
      const aIsIntro = a.name.includes("課程介紹") || a.name.includes("試聽")
      const bIsIntro = b.name.includes("課程介紹") || b.name.includes("試聽")
      if (aIsIntro && !bIsIntro) return -1
      if (!aIsIntro && bIsIntro) return 1
    }
    return a.orderIndex - b.orderIndex
  })

  // 計算影片數量
  const videoCount = chapters.reduce((acc, chapter) => {
    return acc + chapter.lessons.filter(l => l.type === 'video').length
  }, 0)

  // 取得課程描述
  const courseDescription = currentCourse?.slug
    ? COURSE_DESCRIPTIONS[currentCourse.slug]
    : null

  // 處理預約 1v1 諮詢點擊
  const handleAppointmentClick = () => {
    if (isLoggedIn) {
      // 已登入，直接跳轉至預約頁面
      window.location.href = 'https://world.waterballsa.tw/appointment/form'
    } else {
      // 未登入，顯示登入提示
      setShowLoginDialog(true)
    }
  }

  /**
   * 處理「立即加入課程」按鈕點擊（參考 courses 頁面的 handlePurchaseClick）
   * - 未登入：直接跳轉到建立訂單頁面
   * - 已登入：檢查是否有該課程的待付款訂單
   *   - 有：跳轉到完成付款頁面
   *   - 沒有：跳轉到建立訂單頁面
   */
  const handleJoinCourseClick = () => {
    if (!currentCourse?.slug || journey?.id == null) {
      console.error('[JourneysPage] 缺少必要資料，無法跳轉')
      return
    }

    const createOrderUrl = `/journeys/${currentCourse.slug}/orders?productId=${journey.id}`

    console.log('[JourneysPage] 點擊立即加入課程:', {
      slug: currentCourse.slug,
      id: journey.id,
      isLoggedIn,
    })

    // 如果未登入，直接跳轉到建立訂單頁面
    if (!isLoggedIn) {
      console.log('[JourneysPage] 未登入，直接跳轉到建立訂單頁面')
      router.push(createOrderUrl)
      return
    }

    // 已登入：檢查是否有該課程的待付款訂單
    const pendingOrder = orders.find(order => {
      const isSameCourse = order.courseSlug === currentCourse.slug
      const isPending = order.status === 'pending'
      const notExpired = new Date(order.payDeadline) > new Date()
      return isSameCourse && isPending && notExpired
    })

    if (pendingOrder) {
      // 有待付款訂單，跳轉到完成付款頁面
      console.log('[JourneysPage] 發現待付款訂單，跳轉到完成付款頁面:', pendingOrder.orderNo)
      router.push(`/journeys/${currentCourse.slug}/orders?productId=${journey.id}&orderNumber=${pendingOrder.orderNo}`)
    } else {
      // 沒有待付款訂單，跳轉到建立訂單頁面
      console.log('[JourneysPage] 無待付款訂單，跳轉到建立訂單頁面')
      router.push(createOrderUrl)
    }
  }

  // 處理「進入課程」按鈕點擊
  const handleEnterCourseClick = async () => {
    if (!currentCourse?.slug) return

    try {
      // 呼叫 last-watched API 取得最後觀看位置
      const res = await fetch(`/api/journeys/${currentCourse.slug}/last-watched`)

      if (res.ok) {
        const data = await res.json()

        // 如果有最後觀看記錄，跳轉到該位置
        if (data && data.chapterId && data.lessonId) {
          console.log('[JourneysPage] 跳轉到最後觀看位置:', data)
          router.push(`/journeys/${currentCourse.slug}/chapters/${data.chapterId}/missions/${data.lessonId}`)
          return
        }
      }

      // 沒有最後觀看記錄，跳轉到第一個可用的 lesson
      console.log('[JourneysPage] 無最後觀看記錄，跳轉到第一個單元')
      if (chapters.length > 0 && chapters[0].lessons.length > 0) {
        const firstChapter = chapters[0]
        const firstLesson = firstChapter.lessons[0]
        router.push(`/journeys/${currentCourse.slug}/chapters/${firstChapter.id}/missions/${firstLesson.id}`)
      }
    } catch (error) {
      console.error('[JourneysPage] 取得最後觀看位置失敗:', error)
      // 發生錯誤時，跳轉到第一個單元
      if (chapters.length > 0 && chapters[0].lessons.length > 0) {
        const firstChapter = chapters[0]
        const firstLesson = firstChapter.lessons[0]
        router.push(`/journeys/${currentCourse.slug}/chapters/${firstChapter.id}/missions/${firstLesson.id}`)
      }
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center py-12 text-muted-foreground">載入中...</div>
      </div>
    )
  }

  if (!currentCourse || !journey) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <p className="text-lg font-semibold">請先從課程列表中選擇一門課程</p>
          <Button
            onClick={() => router.push('/courses')}
            className="bg-yellow-600 hover:bg-yellow-700 text-black"
          >
            前往課程列表
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左側：課程資訊與章節列表 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 課程標題與描述 */}
          <div>
            <h1 className="text-3xl font-bold mb-4">{journey.name}</h1>
            {courseDescription && (
              <>
                <p className="text-muted-foreground text-lg mb-4">
                  {courseDescription.subtitle}
                </p>
                {courseDescription.paragraphs.map((paragraph, index) => (
                  <p key={index} className="text-muted-foreground mb-4">
                    {paragraph}
                  </p>
                ))}
              </>
            )}

            {/* 統計資訊 */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4" />
                {videoCount} 部影片
              </span>
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                大量實戰題
              </span>
            </div>

            {/* 按鈕 */}
            <div className="flex gap-3">
              <Button
                onClick={journey?.isOwned ? handleEnterCourseClick : handleJoinCourseClick}
                className="bg-yellow-600 hover:bg-yellow-700 text-black"
              >
                {journey?.isOwned ? '進入課程' : '立即加入課程'}
              </Button>
              {/* 預約 1v1 諮詢按鈕（僅軟體設計模式顯示） */}
              {isSoftwareDesignPattern && (
                <Button
                  variant="outline"
                  className="border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white"
                  onClick={handleAppointmentClick}
                >
                  預約 1v1 諮詢
                </Button>
              )}
            </div>
          </div>

          {/* 章節列表 */}
          <div className="space-y-4">
            {/* 章節列表 */}
            {filteredChapters.map((chapter, index) => {
              // 判斷是否為課程介紹 & 試聽章節
              const isIntroChapter = chapter.name.includes("課程介紹") || chapter.name.includes("試聽")

              return (
                <div key={chapter.id}>
                  <Card>
                    <Collapsible
                      open={expandedChapters.has(chapter.id)}
                      onOpenChange={() => toggleChapter(chapter.id)}
                    >
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="flex flex-row items-center justify-between py-4">
                          <CardTitle className="text-lg font-medium text-left">
                            {chapter.name}
                          </CardTitle>
                          {expandedChapters.has(chapter.id) ? (
                            <ChevronDown className="h-5 w-5 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-5 w-5 flex-shrink-0" />
                          )}
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="space-y-1">
                            {chapter.lessons.map((lesson) => (
                              <button
                                key={lesson.id}
                                onClick={() => handleLessonClick(chapter.id, lesson.id)}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left"
                              >
                                {getLessonIcon(lesson.type)}
                                <span className="flex-1">{lesson.name}</span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </button>
                            ))}
                            {/* Gyms */}
                            {chapter.gyms.map((gym) => (
                              <button
                                key={`gym-${gym.id}`}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-left opacity-50 cursor-not-allowed"
                                disabled
                              >
                                <Award className="h-5 w-5 text-muted-foreground" />
                                <span className="flex-1">{gym.name}</span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </button>
                            ))}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                  {/* 軟體設計模式：課程介紹 & 試聽下方加分隔線 */}
                  {isSoftwareDesignPattern && isIntroChapter && (
                    <hr className="my-4 border-border" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 右側：課程證書/購買卡片 */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              {/* 軟體設計模式：顯示證書圖片和標題 */}
              {isSoftwareDesignPattern && (
                <>
                  <div className="relative w-full aspect-[4/3] mb-4 rounded-lg overflow-hidden">
                    <Image
                      src="/images/sample_certificate.png"
                      alt="課程證書"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-center mb-4">課程證書</h3>
                </>
              )}

              {/* 立即加入課程 / 進入課程按鈕 */}
              <Button
                onClick={journey?.isOwned ? handleEnterCourseClick : handleJoinCourseClick}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                {journey?.isOwned ? '進入課程' : '立即加入課程'}
              </Button>
            </CardContent>
          </Card>

          {/* 課程特色（三條項目）- 無邊框，兩個課程都顯示 */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <span>中文課程</span>
            </div>
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <span>支援行動裝置</span>
            </div>
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-muted-foreground" />
              <span>專業的完課認證</span>
            </div>
          </div>
        </div>
      </div>

      {/* 登入提示 Dialog（預約 1v1 諮詢用） */}
      <AlertDialog open={showLoginDialog} onOpenChange={() => {}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>請先登入</AlertDialogTitle>
            <AlertDialogDescription>
              需要登入才能報名喔!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              onClick={() => {
                // 登入後跳轉至預約頁面
                router.push('/login?returnUrl=' + encodeURIComponent('https://world.waterballsa.tw/appointment/form'))
              }}
              className="bg-yellow-600 hover:bg-yellow-700 text-black"
            >
              前往登入
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
