/**
 * 個人檔案頁面（Profile Page）
 * 復刻參考網站的個人檔案頁面
 */
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  User as UserIcon,
  Pencil,
  ExternalLink,
  Clock,
  FileText,
  Github,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EditProfileDialog } from "@/components/edit-profile-dialog"
import { cn } from "@/lib/utils"

/**
 * 使用者資料型別
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
  nickname?: string | null
  gender?: string | null
  occupation?: string | null
  birthday?: string | null
  location?: string | null
  githubUrl?: string | null
}

/**
 * 訂單資料型別
 */
interface Order {
  id: string
  orderNo: string
  userId: string
  courseId: string
  courseTitle: string
  courseSlug: string | null  // 課程 slug（用於跳轉）
  amount: number
  status: "pending" | "paid" | "cancelled"
  payDeadline: string
  paidAt: string | null
  memo: string | null
  createdAt: string
  updatedAt: string
}

// Tab 類型
type TabType = "basic" | "badges" | "skills" | "certificates"

/**
 * 生成訂單完成付款頁面的 URL
 */
function getOrderPaymentUrl(order: Order): string {
  const slug = order.courseSlug || "software-design-pattern" // fallback
  return `/journeys/${slug}/orders?productId=${order.courseId}&orderNumber=${order.orderNo}`
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState<TabType>("basic")
  const [showPendingOrderDialog, setShowPendingOrderDialog] = useState(false)
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null)

  // 載入使用者資料函數
  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("[ProfilePage] 取得使用者資料失敗:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  // 初始載入使用者資料
  useEffect(() => {
    fetchUser()
  }, [])

  // 載入訂單資料
  useEffect(() => {
    async function fetchOrders() {
      if (!user) return

      try {
        const res = await fetch('/api/user/orders')
        if (res.ok) {
          const data: Order[] = await res.json()
          setOrders(data)

          // 檢查是否有未完成的訂單（pending 且未過期）
          const pendingOrders = data.filter(order => {
            if (order.status !== "pending") return false
            const deadline = new Date(order.payDeadline)
            return deadline > new Date()
          })

          // 如果有未完成的訂單，顯示提示對話框
          if (pendingOrders.length > 0) {
            setPendingOrder(pendingOrders[0])
            setShowPendingOrderDialog(true)
          }
        }
      } catch (error) {
        console.error("[ProfilePage] 取得訂單失敗:", error)
      }
    }

    fetchOrders()
  }, [user])

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

  // 取得使用者編號（從 UUID 取最後 4 碼）
  const userNumber = user.id.slice(-4).toUpperCase()

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
  }

  // Tab 項目
  const tabs: { key: TabType; label: string }[] = [
    { key: "basic", label: "基本資料" },
    { key: "badges", label: "道館徽章" },
    { key: "skills", label: "技能評級" },
    { key: "certificates", label: "證書" },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 頂部區域：頭貼 + 名稱 */}
      <div className="flex items-center gap-6 mb-8">
        <Avatar className="h-28 w-28 border-4 border-background shadow-lg">
          <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || "使用者"} />
          <AvatarFallback className="text-4xl bg-muted">
            <UserIcon className="h-14 w-14" />
          </AvatarFallback>
        </Avatar>
        <h1 className="text-3xl font-bold">
          {user.displayName || "使用者"} #{userNumber}
        </h1>
      </div>

      {/* Tab 導航 */}
      <div className="flex gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-6 py-3 rounded-lg font-medium transition-colors",
              activeTab === tab.key
                ? "bg-yellow-600 text-white"
                : "bg-muted hover:bg-muted/80 text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 內容 */}
      {activeTab === "basic" && (
        <div className="space-y-6">
          {/* 基本資料卡片 */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-yellow-500 text-xl">基本資料</CardTitle>
              <EditProfileDialog user={user} onProfileUpdated={fetchUser}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  編輯資料
                </Button>
              </EditProfileDialog>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">暱稱</p>
                  <p className="font-medium">{user.nickname || user.displayName || "尚未設定"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">職業</p>
                  <p className="font-medium">{user.occupation || "尚未設定"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">等級</p>
                  <p className="font-medium">{user.level}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">突破道館數</p>
                  <p className="font-medium">0</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">生日</p>
                  <p className="font-medium">{user.birthday || "尚未設定"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">性別</p>
                  <p className="font-medium">{user.gender || "尚未設定"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">地區</p>
                  <p className="font-medium">{user.location || "尚未設定"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Github 連結</p>
                  <p className="font-medium">{user.githubUrl || "尚未設定"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discord 帳號綁定 */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-yellow-500 text-xl">Discord 帳號綁定</CardTitle>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  沒有獲得學號或身份組嗎？
                  <Link href="#" className="underline ml-1">點此登入領取</Link>
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </div>
                  <span className="text-foreground">{user.email}</span>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  移除 Discord
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* GitHub 帳號 + 課程 GitHub Repos */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-yellow-500 text-xl">GitHub 帳號</CardTitle>
              <span className="text-sm text-muted-foreground">
                綁定 GitHub 帳號後，可享受更多功能
              </span>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* GitHub 帳號綁定狀態 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Github className="w-10 h-10 text-muted-foreground" />
                  <span className="text-muted-foreground">尚未綁定 GitHub 帳號</span>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  綁定 GitHub
                </Button>
              </div>

              {/* 分隔線 */}
              <div className="border-t border-border" />

              {/* 課程 GitHub Repos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">課程 GitHub Repos</h3>

                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  購買 AI x BDD 課程後，即可加入以下課程專屬的 GitHub Repos！
                </div>

                {/* Repo 項目 */}
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">水球軟體學院：AI x BDD：規格驅動全自動開發術</h4>
                      <p className="text-sm text-muted-foreground font-mono">
                        Waterball-Software-Academy/AI-x-BDD-Spec-Driven-100-Automation
                      </p>
                      <p className="text-sm text-yellow-600 mt-1">
                        購買「AI x BDD：規格驅動全自動開發術」課程即可加入
                      </p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      特定課程專屬
                    </Button>
                  </div>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">SDD.os：課程中用到的高精度測試翻譯技術</h4>
                      <p className="text-sm text-muted-foreground font-mono">
                        SDD-TW/sdd.os
                      </p>
                      <p className="text-sm text-yellow-600 mt-1">
                        購買「AI x BDD：規格驅動全自動開發術」課程即可加入
                      </p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      特定課程專屬
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 訂單紀錄 */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                訂單紀錄
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">尚無訂單紀錄</p>
              ) : (
                orders.map((order) => (
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
                      {order.status === "pending" && (
                        <Button
                          variant="outline"
                          onClick={() => router.push(getOrderPaymentUrl(order))}
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
      )}

      {/* 其他 Tab 內容（開發中） */}
      {activeTab === "badges" && (
        <div className="text-center py-12 text-muted-foreground">
          道館徽章功能開發中...
        </div>
      )}

      {activeTab === "skills" && (
        <div className="text-center py-12 text-muted-foreground">
          技能評級功能開發中...
        </div>
      )}

      {activeTab === "certificates" && (
        <div className="text-center py-12 text-muted-foreground">
          證書功能開發中...
        </div>
      )}

      {/* 未完成訂單提示對話框 */}
      <AlertDialog open={showPendingOrderDialog} onOpenChange={setShowPendingOrderDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>你有未完成的訂單</AlertDialogTitle>
            <AlertDialogDescription>
              你有尚未完成付款的訂單，請盡快完成付款以確保您的權益。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowPendingOrderDialog(false)}
            >
              稍後再說
            </Button>
            <Button
              onClick={() => {
                if (pendingOrder) {
                  router.push(getOrderPaymentUrl(pendingOrder))
                }
                setShowPendingOrderDialog(false)
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              完成訂單
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
