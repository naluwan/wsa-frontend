/**
 * 首頁（Home Page）
 * 包含：
 * 1. 提示條（僅軟體設計模式精通之旅顯示）
 * 2. Hero 區塊 - 歡迎來到水球軟體學院
 * 3. 兩個主要課程卡片（從 API 獲取真實資料）
 * 4. 四張資訊卡片
 */
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowRight, Trophy, Sword, TrendingUp, BookOpen, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCourse, AVAILABLE_COURSES } from "@/contexts/course-context"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { X } from "lucide-react"

// 課程資料型別
interface Course {
  id: string
  code: string
  title: string
  description: string
  teacherName: string
  priceTwd: number
  thumbnailUrl?: string
  isOwned?: boolean
  hasFreePreview?: boolean
}

// 假資料：資訊卡片
interface InfoCardButton {
  text: string;
  link: string;
  external?: boolean;
  variant?: "default" | "outline";
}

interface InfoCard {
  id: number;
  title: string;
  description: string;
  icon: any;
  buttons: InfoCardButton[];
}

const infoCards: InfoCard[] = [
  {
    id: 1,
    title: "軟體設計模式之旅課程",
    description: "「用一趟旅程的時間，成為硬核的 Coding 高手」 — 精通一套高效率的 OOAD 思路。",
    icon: BookOpen,
    buttons: [
      {
        text: "查看課程",
        link: "/units",
        variant: "default",
      },
    ],
  },
  {
    id: 2,
    title: "水球潘的部落格",
    description: "觀看水球撰寫的軟體工程師職涯、軟體設計模式及架構學問，以及領域驅動設計等公開文章。",
    icon: BookOpen,
    buttons: [
      {
        text: "閱讀文章",
        link: "https://blog.waterballsa.tw/",
        external: true,
        variant: "default",
      },
    ],
  },
  {
    id: 3,
    title: "直接與老師或是其他工程師交流",
    description: "加入水球成立的工程師 Discord 社群，與水球以及其他工程師線上交流，培養學習習慣及樂趣。",
    icon: TrendingUp,
    buttons: [
      {
        text: "加入 Facebook 社團",
        link: "https://www.facebook.com/groups/waterballsa.tw",
        external: true,
        variant: "default",
      },
      {
        text: "加入 Discord",
        link: "https://discord.com/invite/PAtkRHSmKp",
        external: true,
        variant: "outline",
      },
    ],
  },
  {
    id: 4,
    title: "技能評級及證書系統",
    description: "通過技能評級、獲取證書，打造你的職涯籌碼，讓你在就業市場上脫穎而出。",
    icon: Trophy,
    buttons: [
      {
        text: "了解更多",
        link: "https://world.waterballsa.tw/skills-intro",
        external: true,
        variant: "default",
      },
    ],
  },
]

export default function HomePage() {
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
          console.log('[HomePage] 登入狀態:', !!data.user)
        }
      } catch (error) {
        console.error('[HomePage] 檢查登入狀態失敗:', error)
        setIsLoggedIn(false)
      }
    }
    checkLoginStatus()
  }, [])

  // 判斷是否顯示提示條（只有軟體設計模式精通之旅才顯示）
  const showPromoAlert = currentCourse.id === "DESIGN_PATTERNS"

  /**
   * 處理課程 card 點擊事件
   * 功能: 更新全域課程選擇狀態,同時更新上方篩選器和首頁選擇狀態
   */
  const handleCourseCardClick = (courseCode: string) => {
    // 根據 courseCode 找到對應的 Course 物件
    const targetCourse = AVAILABLE_COURSES.find(c => c.code === courseCode)
    if (targetCourse) {
      setCurrentCourse(targetCourse)
      console.log('[HomePage] 切換課程:', targetCourse.name)
    }
  }

  // 課程顯示設定（根據課程代碼）
  const getCourseDisplayConfig = (courseCode: string) => {
    switch (courseCode) {
      case 'SOFTWARE_DESIGN_PATTERN':
        return {
          image: '/images/course_0.png',
          showPromo: true,
          promoText: '看完課程介紹，立刻折價 3,000 元',
          buttonText: '立即體驗',
        }
      case 'AI_X_BDD':
        return {
          image: '/images/course_1.png',
          showPromo: false,
          promoText: '',
          buttonText: '立刻購買',
        }
      default:
        return {
          image: '/images/course_0.png',
          showPromo: false,
          promoText: '',
          buttonText: '立即體驗',
        }
    }
  }

  /**
   * 處理課程按鈕點擊（試聽課程或購買課程）
   * 如果未登入，顯示登入對話框
   * 如果已登入，導向對應頁面
   */
  const handleCourseButtonClick = (course: Course, displayConfig: any) => {
    console.log('[HomePage] 點擊課程按鈕:', {
      courseCode: course.code,
      buttonText: displayConfig.buttonText,
      isLoggedIn,
      hasFreePreview: course.hasFreePreview,
    })

    // 決定目標 URL
    const targetUrl =
      course.hasFreePreview && displayConfig.buttonText === '立即體驗' && firstFreeUnits[course.code]
        ? `/journeys/${course.code}/missions/${firstFreeUnits[course.code]}`
        : `/courses/${course.code}`

    console.log('[HomePage] 目標 URL:', targetUrl)

    // 如果未登入，顯示登入對話框
    if (!isLoggedIn) {
      console.log('[HomePage] 未登入，顯示登入對話框')
      setLoginReturnUrl(targetUrl)
      setShowLoginDialog(true)
      return
    }

    // 如果已登入，直接導向
    console.log('[HomePage] 已登入，導向目標頁面')
    router.push(targetUrl)
  }

  /**
   * 處理登入對話框的「前往登入」按鈕
   */
  const handleLoginClick = () => {
    console.log('[HomePage] 導向登入頁，returnUrl:', loginReturnUrl)
    router.push(`/login?returnUrl=${encodeURIComponent(loginReturnUrl)}`)
  }

  return (
    <div className="flex flex-col bg-gradient-to-b from-muted/30 to-background">
      {/* 提示條 + Hero 大卡片 + 兩個主要課程 */}
      <section className="w-full">
        <div className="container px-6 py-12 md:py-16">
          {/* 提示條（僅軟體設計模式精通之旅顯示）*/}
          {showPromoAlert && (
            <Alert className="flex items-center justify-between gap-4 mb-6 bg-primary/5 border-primary/20">
              <AlertDescription className="flex-1 mb-0 text-foreground">
                將軟體設計精通之旅體驗課程的全部影片看完就可以獲得 3000 元課程折價券！
              </AlertDescription>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white flex-shrink-0"
              >
                <Link href="/courses/software-design-pattern" className="inline-flex items-center justify-center w-full h-full">
                  前往
                </Link>
              </Button>
            </Alert>
          )}

          <Card className="border-2">
            <CardHeader className="pb-8">
              <CardTitle className="text-3xl md:text-4xl font-bold mb-4">
                歡迎來到水球軟體學院
              </CardTitle>
              <CardDescription className="text-base md:text-lg">
                水球軟體學院提供最先進的軟體設計思路教材，並透過線上 Code Review 來帶你掌握進階軟體架構能力。
                只要每週投資 5 小時，就能打造不平等的優勢，成為硬核的 Coding 實戰高手。
              </CardDescription>
            </CardHeader>

            {/* 兩個主要課程 */}
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">載入中...</div>
              ) : courses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">目前尚無可用課程</div>
              ) : (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {courses.map((course) => {
                    const displayConfig = getCourseDisplayConfig(course.code)
                    const isSelected = currentCourse.code === course.code

                    return (
                      <Card
                        key={course.id}
                        onClick={() => handleCourseCardClick(course.code)}
                        className={`flex flex-col overflow-hidden transition-all duration-300 cursor-pointer hover:scale-105 bg-card ${
                          isSelected
                            ? 'border-2 border-yellow-600 shadow-lg'
                            : 'border-2 border-muted/50 hover:border-yellow-600/50'
                        }`}
                      >
                        {/* 課程封面圖 */}
                        <div className="relative w-full h-48">
                          <Image
                            src={course.thumbnailUrl ? `/${course.thumbnailUrl}` : displayConfig.image}
                            alt={course.title}
                            fill
                            className="object-cover"
                            priority
                          />
                        </div>

                        <CardHeader>
                          <CardTitle className="text-xl">{course.title}</CardTitle>
                          <CardDescription className="text-lg font-semibold text-yellow-600 dark:text-yellow-500">
                            {course.teacherName}
                          </CardDescription>
                        </CardHeader>

                        <CardContent>
                          <p className="text-sm text-muted-foreground">{course.description}</p>
                        </CardContent>

                        <CardFooter className="mt-auto flex flex-col gap-2">
                          {/* 黃色促銷文字（僅軟體設計模式精通之旅顯示）*/}
                          {displayConfig.showPromo && (
                            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-500 text-center w-full">
                              {displayConfig.promoText}
                            </p>
                          )}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation() // 防止觸發卡片的點擊事件
                              handleCourseButtonClick(course, displayConfig)
                            }}
                            className={
                              isSelected
                                ? 'w-full border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white bg-transparent'
                                : 'w-full bg-yellow-600 hover:bg-yellow-700 text-black'
                            }
                            size="lg"
                            variant={isSelected ? 'outline' : 'default'}
                          >
                            {displayConfig.buttonText}
                          </Button>
                        </CardFooter>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 四張資訊卡片 */}
      <section className="w-full pb-12 md:pb-16">
        <div className="container px-6">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto">
            {infoCards.map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.id} className="flex flex-col bg-background border-border/50">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg flex-shrink-0">
                        <Icon className="h-6 w-6 text-foreground" />
                      </div>
                      <CardTitle className="text-lg">{card.title}</CardTitle>
                    </div>
                    <CardDescription className="text-sm">{card.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className={`mt-auto gap-2 items-start ${card.buttons.length > 1 ? 'flex flex-row flex-wrap' : 'flex flex-col'}`}>
                    {card.buttons.map((button, index) => (
                      <Button
                        key={index}
                        asChild
                        variant={button.variant === "outline" ? "outline" : "default"}
                        className={
                          button.variant === "outline"
                            ? "border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white"
                            : "bg-yellow-600 hover:bg-yellow-700 text-black"
                        }
                        size="lg"
                      >
                        {button.external ? (
                          <a
                            href={button.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2"
                          >
                            <span>{button.text}</span>
                            <ArrowRight className="h-4 w-4 flex-shrink-0" />
                          </a>
                        ) : (
                          <Link
                            href={button.link}
                            className="inline-flex items-center gap-2"
                          >
                            <span>{button.text}</span>
                            <ArrowRight className="h-4 w-4 flex-shrink-0" />
                          </Link>
                        )}
                      </Button>
                    ))}
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* 老師介紹區塊 */}
      <section className="w-full pb-12 md:pb-16">
        <div className="container px-6">
          <Card className="border-2 max-w-6xl mx-auto">
            <CardContent className="pt-6">
              {/* Grid layout: avatar on left, content on right */}
              <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 items-start">
                {/* Avatar */}
                <div className="flex justify-center md:justify-start">
                  <Image
                    src="/images/avatar.webp"
                    alt="水球潘"
                    width={200}
                    height={200}
                    className="rounded-full"
                  />
                </div>

                {/* Content */}
                <div className="flex flex-col gap-6">
                  <h2 className="text-2xl md:text-3xl font-bold">水球潘</h2>
                  <p className="text-muted-foreground">
                    七年程式教育者 & 軟體設計學講師，致力於將複雜的軟體設計概念轉化為易於理解和實踐的教學內容。
                  </p>

                  {/* Bullet points with checkmark icons */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-600 flex items-center justify-center">
                        <Check className="h-4 w-4 text-black" />
                      </div>
                      <p className="text-sm">主修 Christopher Alexander 設計模式、軟體架構、分散式系統架構、Clean Architecture、領域驅動設計等領域</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-600 flex items-center justify-center">
                        <Check className="h-4 w-4 text-black" />
                      </div>
                      <p className="text-sm">過去 40 多場 Talk 平均 93 位觀眾參與</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-600 flex items-center justify-center">
                        <Check className="h-4 w-4 text-black" />
                      </div>
                      <p className="text-sm">主辦的學院社群一年內成長超過 6000 位成員</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-600 flex items-center justify-center">
                        <Check className="h-4 w-4 text-black" />
                      </div>
                      <p className="text-sm">帶領軟體工程方法論學習組織「GaaS」超過 200 多位成員，引領 30 組自組織團隊</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-600 flex items-center justify-center">
                        <Check className="h-4 w-4 text-black" />
                      </div>
                      <p className="text-sm">領域驅動設計社群核心志工 & 講師</p>
                    </div>
                  </div>
                </div>
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
