/**
 * 個人檔案頁面（Profile Page）
 *
 * 功能說明：
 * - 顯示當前登入使用者的個人資訊
 * - 包含頭像、顯示名稱、電子郵件、等級、經驗值等資訊
 *
 * 資料來源：
 * - 使用者資料來自 /api/auth/me（真實資料，由後端 /api/user/me 提供）
 * - 不使用任何假資料（mock data）
 *
 * 未登入處理：
 * - 若使用者未登入，顯示提示卡片
 * - 提供「前往登入」按鈕
 *
 * R1 範圍：
 * - 目前僅顯示使用者基本資料
 * - 課程進度、成就系統等功能將在後續版本實作
 */
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { User as UserIcon, Mail, Award, TrendingUp, Calendar } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

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

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * 載入當前登入使用者資料
   *
   * 資料來源：/api/auth/me（真實資料，非假資料）
   */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log("[ProfilePage] 開始取得使用者資料...")
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          console.log("[ProfilePage] 使用者資料:", data)
          // API 回傳 { user: { id, displayName, ... } } 格式
          setUser(data.user)
        } else {
          console.log("[ProfilePage] 未登入或認證失敗")
          setUser(null)
        }
      } catch (error) {
        console.error("[ProfilePage] 取得使用者資料失敗:", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  /**
   * 等級門檻表（與後端 XpService 相同）
   * 索引對應等級，值為該等級所需的累積 XP
   */
  const LEVEL_THRESHOLDS = [
    0, 200, 500, 1500, 3000, 5000, 7000, 9000, 11000, 13000,
    15000, 17000, 19000, 21000, 23000, 25000, 27000, 29000,
    31000, 33000, 35000, 37000, 39000, 41000, 43000, 45000,
    47000, 49000, 51000, 53000, 55000, 57000, 59000, 61000,
    63000, 65000
  ];

  /**
   * 計算升級進度
   * 使用正確的等級門檻表
   */
  const currentLevel = user ? user.level : 1;
  const currentTotalXp = user ? user.totalXp : 0;

  // 當前等級所需的累積 XP
  const currentLevelThreshold = LEVEL_THRESHOLDS[currentLevel - 1] || 0;

  // 下一等級所需的累積 XP（如果已達最高等級，使用當前等級門檻）
  const nextLevelThreshold = currentLevel < LEVEL_THRESHOLDS.length
    ? LEVEL_THRESHOLDS[currentLevel]
    : currentLevelThreshold;

  // 升級所需的 XP 差距
  const xpForNextLevel = nextLevelThreshold - currentLevelThreshold;

  // 當前等級內已獲得的 XP
  const xpInCurrentLevel = currentTotalXp - currentLevelThreshold;

  // 升級進度百分比
  const levelProgress = xpForNextLevel > 0
    ? Math.min(Math.round((xpInCurrentLevel / xpForNextLevel) * 100), 100)
    : 100;

  // 距離下一等級還需要的 XP
  const xpToNextLevel = Math.max(0, nextLevelThreshold - currentTotalXp);

  // 載入中狀態
  if (isLoading) {
    return (
      <div className="container flex min-h-[calc(100vh-16rem)] items-center justify-center px-4">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    )
  }

  // 未登入狀態
  if (!user) {
    return (
      <div className="container flex min-h-[calc(100vh-16rem)] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>請先登入</CardTitle>
            <CardDescription>
              你目前尚未登入，請先登入以查看個人檔案
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">前往登入</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 已登入狀態 - 顯示個人資料
  return (
    <div className="flex flex-col">
      {/* 個人資訊概覽 */}
      <section className="w-full py-12 md:py-16 bg-gradient-to-b from-muted/50 to-background">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* 頭像 */}
                  <div className="flex justify-center md:justify-start">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || "使用者"} />
                      <AvatarFallback className="text-4xl">
                        <UserIcon className="h-16 w-16" />
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* 基本資訊 */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">
                        {user.displayName || "使用者"}
                      </h1>
                      <p className="text-muted-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="secondary" className="text-base px-3 py-1">
                          <Award className="h-4 w-4 mr-1" />
                          Level {user.level}
                        </Badge>
                        <Badge variant="outline">
                          {user.provider === "google" ? "Google" : "Facebook"} 登入
                        </Badge>
                      </div>
                    </div>

                    {/* XP 進度條 */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">升級進度</span>
                        <span className="font-medium">
                          {xpInCurrentLevel.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
                        </span>
                      </div>
                      <Progress value={levelProgress} className="h-3" />
                      <p className="text-xs text-muted-foreground">
                        {currentLevel >= LEVEL_THRESHOLDS.length
                          ? "已達最高等級"
                          : `還需 ${xpToNextLevel.toLocaleString()} XP 升級至 Level ${user.level + 1}`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 經驗值統計 */}
      <section className="w-full py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">經驗值統計</h2>
              <p className="text-muted-foreground">
                你的學習進度與經驗值累積
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* 總經驗值 */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">總經驗值</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.totalXp.toLocaleString()} XP</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    累計經驗值
                  </p>
                </CardContent>
              </Card>

              {/* 本週經驗值 */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">本週經驗值</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.weeklyXp.toLocaleString()} XP</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    本週獲得的經驗值
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* R1 範圍說明 */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">更多功能即將推出</CardTitle>
                <CardDescription>
                  我們正在開發更多功能，包括：
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 課程學習進度追蹤</li>
                  <li>• 成就徽章系統</li>
                  <li>• 學習統計分析</li>
                  <li>• 排行榜與競賽</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
