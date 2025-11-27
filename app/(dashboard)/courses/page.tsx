/**
 * 課程列表頁（主入口）
 *
 * 這是一般使用者進入學習流程的主要入口頁面。
 * 顯示所有可用課程的卡片列表，包含：
 * - 課程封面圖片
 * - 課程名稱與描述
 * - 講師名稱與擁有狀態
 * - 價格資訊
 * - 購買/已擁有狀態
 * - 試聽課程按鈕（跳轉至免費試看單元）
 * - 立刻購買按鈕（跳轉至訂單頁面）
 * - 進入課程按鈕（已購買時，跳轉至最後觀看位置或第一個單元）
 * - 訂單紀錄區塊（顯示使用者的訂單列表）
 * - 課程選定功能（點擊課程卡片會更新 currentCourse context）
 *
 * 資料來源（全部使用 Journey Domain API）：
 * - GET /api/journeys - 取得所有旅程列表
 * - GET /api/journeys/{slug}/chapters - 取得章節列表（用於找第一個免費試看單元）
 * - GET /api/journeys/{slug}/last-watched - 取得最後觀看位置
 * - GET /api/user/orders - 取得使用者訂單列表
 * - GET /api/auth/me - 檢查登入狀態
 *
 * 導向路徑：
 * - 試聽課程 → /journeys/{slug}/chapters/{chapterId}/missions/{lessonId}
 * - 立刻購買 → /journeys/{slug}/orders?productId={journeyId}
 * - 進入課程 → /journeys/{slug}/chapters/{chapterId}/missions/{lessonId}
 */
"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { FileText, X, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCourse } from "@/contexts/course-context"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { JourneyListItem, ChapterDetail, LessonSummary } from "@/types/journey"

/**
 * 擴展的旅程型別（加入前端需要的狀態欄位）
 */
interface Journey extends JourneyListItem {
  isOwned?: boolean;        // 是否已擁有此課程（已登入時才有值）
  hasFreePreview?: boolean; // 是否有免費試看單元
}

/**
 * 訂單資料型別（對應後端 OrderDto）
 */
interface Order {
  id: string;
  orderNo: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string | null;  // 課程 slug（用於跳轉）
  amount: number;
  status: "pending" | "paid" | "cancelled";
  payDeadline: string;
  paidAt: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 生成訂單完成付款頁面的 URL
 */
function getOrderPaymentUrl(order: Order): string {
  const slug = order.courseSlug || "software-design-pattern" // fallback
  return `/journeys/${slug}/orders?productId=${order.courseId}&orderNumber=${order.orderNo}`
}

/**
 * 課程顯示設定（根據 slug）
 */
function getJourneyDisplayConfig(slug: string) {
  switch (slug) {
    case 'software-design-pattern':
      return {
        image: '/images/course_0.png',
        showPromo: true,
        hasFreePreview: true, // 有免費試聽
        description: '用一趟旅程的時間，成為硬核的 Coding 實戰高手',
        firstChapterId: 8,
        firstLessonId: 8001,
      }
    case 'ai-bdd':
      return {
        image: '/images/course_1.png',
        showPromo: false,
        hasFreePreview: false, // 僅限付費，無試聽
        description: 'AI Top 1% 工程師必修課，掌握規格驅動的全自動化開發',
        firstChapterId: 4000,
        firstLessonId: 40001,
      }
    default:
      return {
        image: '/images/course_0.png',
        showPromo: false,
        hasFreePreview: true,
        description: '',
        firstChapterId: 0,
        firstLessonId: 0,
      }
  }
}

/**
 * 格式化日期（YYYY/MM/DD）
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return "無"

  const date = new Date(dateString)
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
}


/**
 * 檢查訂單是否已過期
 */
function isOrderExpired(order: Order): boolean {
  if (order.status !== "pending") return false
  return new Date() > new Date(order.payDeadline)
}

export default function CoursesPage() {
  const router = useRouter()
  const { currentCourse, setCurrentCourse } = useCourse()
  const [journeys, setJourneys] = useState<Journey[]>([])
  const [loading, setLoading] = useState(true)
  const [firstFreeLessons, setFirstFreeLessons] = useState<Record<string, { chapterId: number; lessonId: number }>>({})
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [loginReturnUrl, setLoginReturnUrl] = useState<string>("")
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  // 從 API 獲取旅程資料
  useEffect(() => {
    async function fetchJourneys() {
      try {
        const res = await fetch('/api/journeys')
        if (res.ok) {
          const data: JourneyListItem[] = await res.json()
          // 轉換為擴展型別，使用後端回傳的 isOwned
          const journeysWithState: Journey[] = data.map(j => ({
            ...j,
            isOwned: j.isOwned ?? false, // 使用後端回傳的購買狀態
            hasFreePreview: true, // TODO: 從後端獲取免費試看狀態
          }))
          setJourneys(journeysWithState)
          setLoading(false)

          // 為每個旅程獲取第一個免費試看單元（背景執行，不阻塞頁面載入）
          const freePreviewPromises = data.map(async (journey: JourneyListItem) => {
            try {
              const chaptersRes = await fetch(`/api/journeys/${journey.slug}/chapters`)
              if (chaptersRes.ok) {
                const chapters: ChapterDetail[] = await chaptersRes.json()
                // 找到第一個非 premium 的 lesson
                for (const chapter of chapters) {
                  const freeLesson = chapter.lessons.find((l: LessonSummary) => !l.premiumOnly)
                  if (freeLesson) {
                    setFirstFreeLessons(prev => ({
                      ...prev,
                      [journey.slug]: {
                        chapterId: chapter.id,
                        lessonId: freeLesson.id
                      }
                    }))
                    // 更新該旅程的 hasFreePreview 狀態
                    setJourneys(prev => prev.map(j =>
                      j.slug === journey.slug ? { ...j, hasFreePreview: true } : j
                    ))
                    break
                  }
                }
              }
            } catch (error) {
              console.error(`獲取旅程 ${journey.slug} 免費單元失敗:`, error)
            }
          })

          // 在背景等待所有免費單元請求完成（不阻塞頁面）
          Promise.all(freePreviewPromises).catch(error => {
            console.error('獲取免費單元時發生錯誤:', error)
          })
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('獲取旅程資料失敗:', error)
        setLoading(false)
      }
    }
    fetchJourneys()
  }, [])

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
          console.log('[CoursesPage] 登入狀態:', !!data.user)
        }
      } catch (error) {
        console.error('[CoursesPage] 檢查登入狀態失敗:', error)
        setIsLoggedIn(false)
      }
    }
    checkLoginStatus()
  }, [])

  // 根據登入狀態獲取使用者所有訂單
  useEffect(() => {
    async function fetchOrders() {
      // 如果未登入，清空訂單列表
      if (!isLoggedIn) {
        setOrders([])
        return
      }

      setOrdersLoading(true)
      try {
        const res = await fetch('/api/user/orders')
        if (res.ok) {
          const data: Order[] = await res.json()
          setOrders(data)
        } else {
          console.error('[CoursesPage] 獲取訂單失敗:', res.status)
          setOrders([])
        }
      } catch (error) {
        console.error('[CoursesPage] 獲取訂單錯誤:', error)
        setOrders([])
      } finally {
        setOrdersLoading(false)
      }
    }

    fetchOrders()
  }, [isLoggedIn])

  // 根據當前選擇的課程篩選訂單
  const filteredOrders = useMemo(() => {
    if (!currentCourse?.slug) {
      return orders // 如果沒有選擇課程，顯示所有訂單
    }
    return orders.filter(order => order.courseSlug === currentCourse.slug)
  }, [orders, currentCourse?.slug])

  // 處理旅程卡片點擊
  const handleJourneyClick = (journey: Journey) => {
    // 更新 context 中的當前課程
    setCurrentCourse({
      id: journey.id,
      name: journey.name,
      slug: journey.slug,
    })
  }

  // 軟體設計模式精通之旅的固定試聽課程連結
  const SOFTWARE_DESIGN_PATTERN_FREE_PREVIEW_URL = '/journeys/software-design-pattern/chapters/8/missions/8001'

  /**
   * 處理「試聽課程」按鈕點擊
   */
  const handlePreviewClick = (journey: Journey) => {
    // 軟體設計模式精通之旅使用固定的試聽課程連結
    const targetUrl = journey.slug === 'software-design-pattern'
      ? SOFTWARE_DESIGN_PATTERN_FREE_PREVIEW_URL
      : `/journeys/${journey.slug}`

    console.log('[CoursesPage] 點擊試聽課程:', {
      slug: journey.slug,
      targetUrl,
      isLoggedIn,
    })

    // 如果未登入，顯示登入對話框
    if (!isLoggedIn) {
      console.log('[CoursesPage] 未登入，顯示登入對話框')
      setLoginReturnUrl(targetUrl)
      setShowLoginDialog(true)
      return
    }

    // 如果已登入，直接導向
    router.push(targetUrl)
  }

  /**
   * 處理「立刻購買」按鈕點擊
   * - 未登入：直接跳轉到建立訂單頁面
   * - 已登入：檢查是否有該課程的待付款訂單
   *   - 有：跳轉到完成付款頁面
   *   - 沒有：跳轉到建立訂單頁面
   */
  const handlePurchaseClick = (journey: Journey) => {
    const createOrderUrl = `/journeys/${journey.slug}/orders?productId=${journey.id}`

    console.log('[CoursesPage] 點擊立刻購買:', {
      slug: journey.slug,
      id: journey.id,
      isLoggedIn,
    })

    // 如果未登入，直接跳轉到建立訂單頁面
    if (!isLoggedIn) {
      console.log('[CoursesPage] 未登入，直接跳轉到建立訂單頁面')
      router.push(createOrderUrl)
      return
    }

    // 已登入：檢查是否有該課程的待付款訂單
    const pendingOrder = orders.find(order =>
      order.courseSlug === journey.slug &&
      order.status === "pending" &&
      !isOrderExpired(order)
    )

    if (pendingOrder) {
      // 有待付款訂單，跳轉到完成付款頁面
      console.log('[CoursesPage] 發現待付款訂單，跳轉到完成付款頁面:', pendingOrder.orderNo)
      router.push(getOrderPaymentUrl(pendingOrder))
    } else {
      // 沒有待付款訂單，跳轉到建立訂單頁面
      console.log('[CoursesPage] 無待付款訂單，跳轉到建立訂單頁面')
      router.push(createOrderUrl)
    }
  }

  /**
   * 處理登入對話框的「前往登入」按鈕
   */
  const handleLoginClick = () => {
    console.log('[CoursesPage] 導向登入頁，returnUrl:', loginReturnUrl)
    router.push(`/login?returnUrl=${encodeURIComponent(loginReturnUrl)}`)
  }

  /**
   * 處理「進入課程」按鈕點擊
   * 先呼叫 last-watched API，有資料就跳轉到最後觀看的位置，沒有就跳轉到第一個單元
   */
  const handleEnterCourseClick = async (journey: Journey) => {
    const displayConfig = getJourneyDisplayConfig(journey.slug)

    try {
      // 呼叫 last-watched API
      const res = await fetch(`/api/journeys/${journey.slug}/last-watched`)

      if (res.ok) {
        const data = await res.json()

        // 如果有最後觀看記錄，跳轉到該位置
        if (data && data.chapterId && data.lessonId) {
          console.log('[CoursesPage] 跳轉到最後觀看位置:', data)
          router.push(`/journeys/${journey.slug}/chapters/${data.chapterId}/missions/${data.lessonId}`)
          return
        }
      }

      // 沒有最後觀看記錄或 API 失敗，跳轉到第一個單元
      console.log('[CoursesPage] 無最後觀看記錄，跳轉到第一個單元')
      router.push(`/journeys/${journey.slug}/chapters/${displayConfig.firstChapterId}/missions/${displayConfig.firstLessonId}`)
    } catch (error) {
      console.error('[CoursesPage] 取得最後觀看位置失敗:', error)
      // 發生錯誤時，跳轉到第一個單元
      router.push(`/journeys/${journey.slug}/chapters/${displayConfig.firstChapterId}/missions/${displayConfig.firstLessonId}`)
    }
  }

  return (
    <div className="flex flex-col">
      {/* 課程列表 */}
      <section className="w-full py-6 md:py-8">
        <div className="container px-4 md:px-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">載入中...</div>
          ) : journeys.length === 0 ? (
            // 無課程時的提示
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">目前尚無可用課程</p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
              {journeys.map((journey) => {
                const displayConfig = getJourneyDisplayConfig(journey.slug);
                const isSelected = currentCourse?.slug === journey.slug;

                return (
                  <Card
                    key={journey.id}
                    onClick={() => handleJourneyClick(journey)}
                    className={`flex flex-col overflow-hidden transition-all duration-300 cursor-pointer hover:scale-105 bg-card ${
                      isSelected
                        ? 'border-2 border-yellow-600 shadow-lg'
                        : 'border-2 border-muted/50 hover:border-yellow-600/50'
                    }`}
                    data-testid="course-card"
                  >
                    {/* 課程封面圖 */}
                    <div className="relative w-full h-48">
                      <Image
                        src={journey.thumbnailUrl ? `/${journey.thumbnailUrl}` : displayConfig.image}
                        alt={journey.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <CardHeader>
                      <CardTitle
                        className="text-xl line-clamp-2"
                        data-testid="course-title"
                      >
                        {journey.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-yellow-600 dark:text-yellow-500">
                          {journey.teacherName || '水球潘'}
                        </span>
                        {/* 擁有狀態 badge */}
                        {journey.isOwned ? (
                          <Badge className="bg-green-600 hover:bg-green-700 text-white">
                            已擁有
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-600 hover:bg-yellow-700 text-black">
                            尚未擁有
                          </Badge>
                        )}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {displayConfig.description || journey.description || '暫無描述'}
                      </p>
                    </CardContent>

                    <CardFooter className="pt-3 flex flex-col gap-0">
                      {/* 折價券區塊（僅軟體設計模式精通之旅且未擁有時顯示）*/}
                      {displayConfig.showPromo && !journey.isOwned && (
                        <>
                          <div className="w-full bg-yellow-600 text-black px-4 py-4 rounded-t-md flex items-center justify-center -mx-6">
                            <span className="text-base font-bold">
                              你有一張 3,000 折價券
                            </span>
                          </div>
                          {/* 向下箭頭 - 指向右側按鈕 */}
                          <div className="w-full flex justify-end pr-[25%] mb-3">
                            <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[15px] border-t-yellow-600"></div>
                          </div>
                        </>
                      )}

                      {/* 按鈕區 */}
                      <div className={`w-full flex gap-2 ${displayConfig.showPromo && !journey.isOwned ? '' : 'mt-3'}`}>
                        {/* 試聽課程按鈕 / 僅限付費按鈕（已擁有時隱藏） */}
                        {!journey.isOwned && (
                          displayConfig.hasFreePreview ? (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePreviewClick(journey)
                              }}
                              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black"
                              size="lg"
                              data-testid="preview-course-button"
                            >
                              試聽課程
                            </Button>
                          ) : (
                            <Button
                              disabled
                              className="flex-1 bg-muted text-muted-foreground cursor-not-allowed"
                              size="lg"
                              onClick={(e) => e.stopPropagation()}
                              data-testid="paid-only-button"
                            >
                              僅限付費
                            </Button>
                          )
                        )}

                        {/* 立刻購買按鈕 / 進入課程按鈕 */}
                        {journey.isOwned ? (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              // 呼叫 last-watched API 並跳轉
                              handleEnterCourseClick(journey)
                            }}
                            className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black"
                            size="lg"
                            data-testid="enter-course-button"
                          >
                            進入課程
                          </Button>
                        ) : (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePurchaseClick(journey)
                            }}
                            className="flex-1 border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white bg-transparent"
                            size="lg"
                            variant="outline"
                            data-testid="purchase-course-button"
                          >
                            立刻購買
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* 訂單紀錄 */}
      <section className="w-full pb-12 md:pb-16">
        <div className="container px-4 md:px-6">
          <Card className="max-w-7xl mx-auto border-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-yellow-600" />
                <CardTitle className="text-2xl">訂單紀錄</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isLoggedIn ? (
                <div className="text-center py-12 text-muted-foreground">
                  請先登入以查看訂單紀錄
                </div>
              ) : ordersLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  載入訂單紀錄中...
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  目前沒有訂單紀錄
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div key={order.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="grid grid-cols-3 gap-8 flex-1">
                        <div>
                          <p className="text-sm text-muted-foreground">訂單編號</p>
                          <p className="font-mono font-semibold">{order.orderNo}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {order.status === "paid" ? "付款日期" : "付款截止日期"}
                          </p>
                          <p className="font-semibold">
                            {order.status === "paid" && order.paidAt
                              ? formatDate(order.paidAt)
                              : formatDate(order.payDeadline)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">課程名稱</p>
                          <p className="font-semibold">{order.courseTitle}</p>
                        </div>
                      </div>
                      <div>
                        {order.status === "pending" && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">
                            <Clock className="h-4 w-4" />
                            待付款
                          </span>
                        )}
                        {order.status === "paid" && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-sm">
                            已付款
                          </span>
                        )}
                        {order.status === "cancelled" && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-500/20 text-red-500 text-sm">
                            已取消
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">金額</p>
                        <p className="text-xl font-bold">NT$ {order.amount.toLocaleString()}</p>
                        {order.memo && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground">備註</p>
                            <p className="text-sm">{order.memo}</p>
                          </div>
                        )}
                      </div>
                      {order.status === "pending" && !isOrderExpired(order) && (
                        <Button
                          onClick={() => router.push(getOrderPaymentUrl(order))}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          立即完成訂單
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 登入提示對話框 */}
      <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent className="sm:max-w-md" data-testid="login-prompt-dialog">
          <button
            onClick={() => setShowLoginDialog(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">關閉</span>
          </button>

          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">請先登入</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              完成登入並擁有完整課程影片，就可以立即觀課程囉！
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="sm:justify-center">
            <Button
              onClick={handleLoginClick}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8"
              size="lg"
              data-testid="goto-login-button"
            >
              前往登入
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
