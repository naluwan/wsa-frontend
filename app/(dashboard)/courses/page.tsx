/**
 * 課程頁面（Courses Page）
 * 顯示所有可用課程，包含：
 * - 課程封面圖片
 * - 課程名稱與描述
 * - 講師名稱與擁有狀態
 * - 價格資訊
 * - 購買/已擁有狀態
 * - 試聽課程按鈕
 * - 訂單紀錄
 * - 課程選定功能（與篩選器同步）
 *
 * 資料來源：後端 API /api/courses（真實資料）
 */
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { FileText, X } from "lucide-react"

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

/**
 * 課程資料型別（對應後端 CourseDto）
 */
interface Course {
  id: string;
  code: string;
  title: string;
  description: string;
  levelTag: string;
  totalUnits: number;
  coverIcon: string;
  teacherName: string;      // 講師名稱
  priceTwd: number;         // 價格（新台幣）
  thumbnailUrl?: string;    // 縮圖網址（選填）
  isOwned?: boolean;        // 是否已擁有此課程（已登入時才有值）
  hasFreePreview?: boolean; // 是否有免費試看單元
}

/**
 * 課程顯示設定（根據課程代碼）
 */
function getCourseDisplayConfig(courseCode: string) {
  switch (courseCode) {
    case 'SOFTWARE_DESIGN_PATTERN':
      return {
        image: '/images/course_0.png',
        showPromo: true,
      }
    case 'AI_X_BDD':
      return {
        image: '/images/course_1.png',
        showPromo: false,
      }
    default:
      return {
        image: '/images/course_0.png',
        showPromo: false,
      }
  }
}

export default function CoursesPage() {
  const router = useRouter()
  const { currentCourse, setCurrentCourse } = useCourse()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [firstFreeUnits, setFirstFreeUnits] = useState<Record<string, string>>({})
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [loginReturnUrl, setLoginReturnUrl] = useState<string>("")

  // 從 API 獲取課程資料
  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/courses')
        if (res.ok) {
          const data = await res.json()
          setCourses(data)

          // 為每個有免費試看的課程獲取第一個免費單元
          data.forEach(async (course: Course) => {
            if (course.hasFreePreview) {
              const detailRes = await fetch(`/api/courses/${course.code}`)
              if (detailRes.ok) {
                const detail = await detailRes.json()
                // 找到第一個免費試看單元
                for (const section of detail.sections) {
                  const freeUnit = section.units.find((u: any) => u.isFreePreview)
                  if (freeUnit) {
                    setFirstFreeUnits(prev => ({
                      ...prev,
                      [course.code]: freeUnit.unitId
                    }))
                    break
                  }
                }
              }
            }
          })
        }
      } catch (error) {
        console.error('獲取課程資料失敗:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
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

  // 處理課程卡片點擊
  const handleCourseClick = (course: Course) => {
    // 更新 context 中的當前課程
    const courseInContext = {
      id: course.code === 'SOFTWARE_DESIGN_PATTERN' ? 'DESIGN_PATTERNS' as const : 'AI_BDD' as const,
      name: course.title,
      code: course.code,
    }
    setCurrentCourse(courseInContext)
  }

  /**
   * 處理「試聽課程」按鈕點擊
   */
  const handlePreviewClick = (course: Course) => {
    const targetUrl = firstFreeUnits[course.code]
      ? `/journeys/${course.code}/missions/${firstFreeUnits[course.code]}`
      : `/courses/${course.code}`

    console.log('[CoursesPage] 點擊試聽課程:', {
      courseCode: course.code,
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
   */
  const handlePurchaseClick = (course: Course) => {
    const targetUrl = `/courses/${course.code}`

    console.log('[CoursesPage] 點擊立刻購買:', {
      courseCode: course.code,
      targetUrl,
      isLoggedIn,
    })

    // 直接導向課程詳情頁（購買邏輯在課程詳情頁處理）
    router.push(targetUrl)
  }

  /**
   * 處理登入對話框的「前往登入」按鈕
   */
  const handleLoginClick = () => {
    console.log('[CoursesPage] 導向登入頁，returnUrl:', loginReturnUrl)
    router.push(`/login?returnUrl=${encodeURIComponent(loginReturnUrl)}`)
  }

  return (
    <div className="flex flex-col">
      {/* 課程列表 */}
      <section className="w-full py-6 md:py-8">
        <div className="container px-4 md:px-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">載入中...</div>
          ) : courses.length === 0 ? (
            // 無課程時的提示
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">目前尚無可用課程</p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
              {courses.map((course) => {
                const displayConfig = getCourseDisplayConfig(course.code);
                const isSelected = currentCourse.code === course.code;

                return (
                  <Card
                    key={course.id}
                    onClick={() => handleCourseClick(course)}
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
                        src={course.thumbnailUrl ? `/${course.thumbnailUrl}` : displayConfig.image}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <CardHeader>
                      <CardTitle
                        className="text-xl line-clamp-2"
                        data-testid="course-title"
                      >
                        {course.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-yellow-600 dark:text-yellow-500">
                          {course.teacherName}
                        </span>
                        {/* 擁有狀態 badge */}
                        {course.isOwned ? (
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
                        {course.description}
                      </p>
                    </CardContent>

                    <CardFooter className="pt-3 flex flex-col gap-0">
                      {/* 折價券區塊（僅軟體設計模式精通之旅且未擁有時顯示）*/}
                      {displayConfig.showPromo && !course.isOwned && (
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
                      <div className={`w-full flex gap-2 ${displayConfig.showPromo && !course.isOwned ? '' : 'mt-3'}`}>
                        {/* 試聽課程按鈕 / 僅限付費按鈕 */}
                        {course.hasFreePreview ? (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePreviewClick(course)
                            }}
                            className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black"
                            size="lg"
                          >
                            試聽課程
                          </Button>
                        ) : (
                          <Button
                            disabled
                            className="flex-1 bg-muted text-muted-foreground cursor-not-allowed"
                            size="lg"
                            onClick={(e) => e.stopPropagation()}
                          >
                            僅限付費
                          </Button>
                        )}

                        {/* 立刻購買按鈕 / 進入課程按鈕 */}
                        {course.isOwned ? (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/courses/${course.code}`)
                            }}
                            className="flex-1 border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white bg-transparent"
                            size="lg"
                            variant="outline"
                          >
                            進入課程
                          </Button>
                        ) : (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePurchaseClick(course)
                            }}
                            className="flex-1 border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white bg-transparent"
                            size="lg"
                            variant="outline"
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
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                目前沒有訂單紀錄
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 登入提示對話框 */}
      <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent className="sm:max-w-md">
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
            >
              前往登入
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
