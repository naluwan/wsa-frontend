/**
 * SiteHeader 組件 - 全站頂部導覽列
 *
 * 功能說明：
 * - 顯示 Logo（僅在登入頁面顯示，其他頁面由 Sidebar 顯示）
 * - 顯示課程選擇下拉選單（已登入且非登入頁面）
 * - 顯示「前往挑戰」按鈕（已登入且非登入頁面，且非 AI_BDD 課程）
 * - 顯示通知鈴鐺（已登入狀態）
 * - 顯示使用者頭像與個人資訊下拉選單（已登入狀態）
 * - 顯示登入按鈕（未登入狀態）
 * - 主題切換功能（整合在使用者下拉選單中）
 *
 * 資料來源：
 * - 使用者資料來自 /api/auth/me（真實資料，由後端 /api/user/me 提供）
 * - 每次路由變更時重新取得使用者資料，確保狀態同步
 *
 * 狀態管理：
 * - user: 當前登入使用者資料（未登入時為 null）
 * - isLoading: 載入使用者資料中
 * - isDropdownOpen: 使用者下拉選單開關狀態
 * - isNotificationOpen: 通知下拉選單開關狀態
 * - currentCourse: 當前選擇的課程（來自 CourseContext）
 */
"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { User, LogOut, Users, Sun, Moon, Bell, Map, ChevronDown, Menu, RotateCcw } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCourse, AVAILABLE_COURSES } from "@/contexts/course-context"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { useSidebar } from "@/contexts/sidebar-context"
import { cn } from "@/lib/utils"

/**
 * 使用者資料型別
 * 對應後端 /api/user/me 回傳的資料格式
 */
interface UserData {
  id: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  provider: string
  level: number
  totalXp: number
  weeklyXp: number
}

/**
 * 通知資料型別（目前使用 Mock 資料）
 */
interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: Date
}

export function SiteHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { currentCourse, setCurrentCourse } = useCourse()
  const { isCollapsed, toggleSidebar } = useSidebar()
  const [user, setUser] = React.useState<UserData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  // Mock 通知資料（未來需要從 API 取得）
  const [notifications] = React.useState<Notification[]>([])

  // 等級門檻表（與後端 XpService 相同）
  const LEVEL_THRESHOLDS = [
    0, 200, 500, 1500, 3000, 5000, 7000, 9000, 11000, 13000,
    15000, 17000, 19000, 21000, 23000, 25000, 27000, 29000,
    31000, 33000, 35000, 37000, 39000, 41000, 43000, 45000,
    47000, 49000, 51000, 53000, 55000, 57000, 59000, 61000,
    63000, 65000
  ];

  // 檢查是否為認證頁面（登入頁面）
  const isAuthPage = pathname.startsWith('/login')

  // 檢查是否為課程學習頁面
  const isJourneyPage = pathname.startsWith('/journeys/')

  // 檢查是否應該顯示「前往挑戰」按鈕
  // 當選擇 AI_BDD 課程時，隱藏此按鈕
  const shouldShowChallengeButton = !isAuthPage && currentCourse.id !== "AI_BDD"

  // 確保主題切換器已完成載入（避免 hydration mismatch）
  React.useEffect(() => {
    setMounted(true)
  }, [])

  /**
   * 取得當前登入使用者資訊
   *
   * 執行時機：
   * - 元件首次載入時
   * - pathname 變更時（例如從登入頁導回首頁、切換頁面等）
   * - 收到 'userXpUpdated' 事件時（例如完成單元獲得 XP）
   *
   * 資料來源：/api/auth/me（真實資料，來自後端 /api/user/me）
   *
   * 處理邏輯：
   * - 成功：設定 user 狀態為使用者資料
   * - 失敗或未登入：設定 user 為 null
   */
  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log("[SiteHeader] 開始取得使用者資訊...")
        const response = await fetch("/api/auth/me", {
          credentials: "include", // 確保 cookie 會被傳送
        })
        console.log("[SiteHeader] /api/auth/me 回應狀態:", response.status)

        if (response.ok) {
          const data = await response.json()
          console.log("[SiteHeader] 使用者資料:", data)
          // API 回傳 { user: { id, displayName, email, ... } } 格式
          setUser(data.user)
        } else {
          console.log("[SiteHeader] 未登入或認證失敗")
          setUser(null)
        }
      } catch (error) {
        console.error("[SiteHeader] 取得使用者資訊失敗:", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()

    // 監聽自定義事件：當使用者 XP 更新時重新載入使用者資料
    const handleXpUpdate = () => {
      console.log("[SiteHeader] 收到 XP 更新事件，重新載入使用者資料")
      fetchUser()
    }

    window.addEventListener('userXpUpdated', handleXpUpdate)

    return () => {
      window.removeEventListener('userXpUpdated', handleXpUpdate)
    }
  }, [pathname]) // 監聽 pathname 變化，確保登入後或路由變更時都能取得最新資料

  /**
   * 登出處理函式
   *
   * 流程：
   * 1. 呼叫後端 /api/auth/logout 清除 httpOnly cookie
   * 2. 清除前端 user 狀態
   * 3. 重新導向到首頁並強制重新載入頁面
   *
   * 注意：httpOnly cookie 無法從前端 JavaScript 直接刪除，
   *       必須透過後端 API 清除
   */
  const handleLogout = async () => {
    try {
      console.log("[SiteHeader] 開始登出...")

      // 呼叫後端 API 清除 httpOnly cookie 中的 JWT token
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      console.log("[SiteHeader] 登出 API 回應狀態:", response.status)

      if (response.ok) {
        console.log("[SiteHeader] 登出成功，清除狀態並重新導向")
        // 清除前端的使用者狀態
        setUser(null)
        // 重新導向到首頁並強制重新載入頁面（確保所有狀態都被清除）
        window.location.href = "/"
      } else {
        console.error("[SiteHeader] 登出 API 回應失敗")
      }
    } catch (error) {
      console.error("[SiteHeader] 登出失敗:", error)
    }
  }

  /**
   * 重置使用者資料處理函式
   *
   * 功能：
   * - 重置使用者的課程觀看進度（清除所有 user_unit_progress）
   * - 重置經驗值（totalXp = 0, weeklyXp = 0, level = 1）
   * - 重置訂單（清除所有 user_courses）
   *
   * 流程：
   * 1. 顯示確認對話框
   * 2. 呼叫後端 /api/user/reset
   * 3. 成功後重新整理頁面
   */
  const handleReset = async () => {
    if (!confirm("確定要重置所有資料嗎？\n\n這將清除：\n- 所有課程觀看進度\n- 經驗值（重置為 0）\n- 所有課程訂單\n\n此操作無法復原！")) {
      return
    }

    try {
      console.log("[SiteHeader] 開始重置使用者資料...")

      const response = await fetch("/api/user/reset", {
        method: "POST",
        credentials: "include",
      })

      console.log("[SiteHeader] 重置 API 回應狀態:", response.status)

      if (response.ok) {
        console.log("[SiteHeader] 重置成功，重新整理頁面")
        alert("重置成功！頁面即將重新整理。")
        // 重新整理頁面以載入最新資料
        window.location.href = "/"
      } else {
        console.error("[SiteHeader] 重置 API 回應失敗")
        alert("重置失敗，請稍後再試。")
      }
    } catch (error) {
      console.error("[SiteHeader] 重置失敗:", error)
      alert("重置失敗，請稍後再試。")
    }
  }

  /**
   * 課程選擇變更處理函式
   */
  const handleCourseChange = (courseId: string) => {
    const course = AVAILABLE_COURSES.find(c => c.id === courseId)
    if (course) {
      setCurrentCourse(course)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="relative flex h-full items-center px-6">
        {/* 課程學習頁面的漢堡排（桌面版在 sidebar 旁邊，手機版固定在左側）*/}
        {isJourneyPage && (
          <button
            onClick={toggleSidebar}
            className={cn(
              "absolute z-50 flex h-10 w-10 items-center justify-center bg-background hover:bg-muted border rounded transition-all duration-300",
              // 手機版固定在左側，桌面版跟隨 sidebar（加間距）
              "left-4 md:transition-all md:duration-300",
              !isCollapsed && "md:left-[272px]" // 264px (sidebar) + 8px (間距)
            )}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* 漢堡排選單（僅在非認證頁面且非課程學習頁面的手機版顯示）*/}
        {!isAuthPage && !isJourneyPage && (
          <div className="mr-4 lg:hidden">
            <MobileSidebar>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </MobileSidebar>
          </div>
        )}

        {/* Logo（僅在認證頁面顯示）*/}
        {isAuthPage && (
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              WSA
            </span>
          </Link>
        )}

        {/* 中間區域：課程選擇下拉選單（非登入頁面且非課程學習頁面）*/}
        {!isAuthPage && !isJourneyPage && (
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Select
              value={currentCourse.id}
              onValueChange={handleCourseChange}
            >
              <SelectTrigger className="w-[280px] md:w-[350px]">
                <SelectValue placeholder="選擇課程">
                  {currentCourse.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_COURSES.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 右側操作區 */}
        <div className="flex items-center gap-3 ml-auto">
          {/* 前往挑戰按鈕（已登入且非登入頁面，且非 AI_BDD 課程）*/}
          {user && !isAuthPage && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className={shouldShowChallengeButton ? '' : 'invisible pointer-events-none'}
            >
              <Link href="/map" className="inline-flex items-center justify-center gap-2 w-full h-full">
                <Map className="h-4 w-4" />
                <span className="hidden sm:inline">前往挑戰</span>
              </Link>
            </Button>
          )}

          {/* 通知鈴鐺（已登入狀態）*/}
          {user && (
            <DropdownMenu open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onMouseEnter={() => setIsNotificationOpen(true)}
                  onMouseLeave={() => setIsNotificationOpen(false)}
                >
                  <Bell className="h-5 w-5" />
                  {/* 未讀通知標記（如果有未讀通知）*/}
                  {notifications.some(n => !n.read) && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80"
                onMouseEnter={() => setIsNotificationOpen(true)}
                onMouseLeave={() => setIsNotificationOpen(false)}
              >
                {/* 通知標題 */}
                <div className="px-4 py-3 border-b">
                  <h3 className="font-semibold">Notifications</h3>
                </div>

                {/* 未讀通知區塊 */}
                <div className="py-2">
                  <div className="px-4 py-2 text-sm font-medium text-muted-foreground">
                    Unread
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      Nice - that's all for now.
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem key={notification.id} className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {notification.message}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* 使用者頭像或登入按鈕 */}
          {isLoading ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <div
                  className="relative h-10 w-10 rounded-full cursor-pointer"
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || "使用者"} />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80"
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
                {/* 使用者資訊卡片 */}
                <div className="flex flex-col gap-3 p-4">
                  {/* 使用者名稱和等級 */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || "使用者"} />
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1">
                      <p className="font-semibold text-base">
                        {user.displayName || "使用者"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Lv. {user.level}
                      </p>
                    </div>
                  </div>

                  {/* 經驗值資訊 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">經驗值</span>
                      <span className="font-medium">
                        {(() => {
                          const currentLevel = user.level;
                          const currentTotalXp = user.totalXp;
                          const currentLevelThreshold = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
                          const nextLevelThreshold = currentLevel < LEVEL_THRESHOLDS.length
                            ? LEVEL_THRESHOLDS[currentLevel]
                            : currentLevelThreshold;
                          const xpForNextLevel = nextLevelThreshold - currentLevelThreshold;
                          const xpInCurrentLevel = currentTotalXp - currentLevelThreshold;

                          return `${xpInCurrentLevel} / ${xpForNextLevel} XP`;
                        })()}
                      </span>
                    </div>
                    {/* 經驗值進度條 */}
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-purple-600 transition-all duration-300"
                        style={{
                          width: `${(() => {
                            const currentLevel = user.level;
                            const currentTotalXp = user.totalXp;
                            const currentLevelThreshold = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
                            const nextLevelThreshold = currentLevel < LEVEL_THRESHOLDS.length
                              ? LEVEL_THRESHOLDS[currentLevel]
                              : currentLevelThreshold;
                            const xpForNextLevel = nextLevelThreshold - currentLevelThreshold;
                            const xpInCurrentLevel = currentTotalXp - currentLevelThreshold;

                            return xpForNextLevel > 0
                              ? Math.min((xpInCurrentLevel / xpForNextLevel) * 100, 100)
                              : 100;
                          })()}%`
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      本週獲得 {user.weeklyXp} XP
                    </p>
                  </div>
                </div>

                <DropdownMenuSeparator />

                {/* 選單項目 */}
                <div className="py-1">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer px-4 py-2">
                      <User className="mr-2 h-4 w-4" />
                      個人檔案
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    onSelect={(e) => e.preventDefault()}
                    className="cursor-pointer px-4 py-2"
                  >
                    {mounted && theme === "dark" ? (
                      <Moon className="mr-2 h-4 w-4" />
                    ) : (
                      <Sun className="mr-2 h-4 w-4" />
                    )}
                    切換主題
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/invite" className="cursor-pointer px-4 py-2">
                      <Users className="mr-2 h-4 w-4" />
                      邀請好友
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleReset}
                    onSelect={(e) => e.preventDefault()}
                    className="cursor-pointer px-4 py-2"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    重置資料
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator />

                {/* 登出按鈕 */}
                <div className="py-1">
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer px-4 py-2"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    登出
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/login" className="inline-flex items-center justify-center w-full h-full">
                登入
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
