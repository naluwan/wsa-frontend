/**
 * 個人檔案 - 訂單列表頁面
 * URL: /profile/orders
 * 顯示使用者的所有訂單（全部課程）
 */
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * 訂單資料型別（對應後端 OrderDto）
 */
interface Order {
  id: string;
  orderNo: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  status: "pending" | "paid" | "cancelled";
  payDeadline: string;
  paidAt: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 格式化日期時間
 */
function formatDateTime(dateString: string | null): string {
  if (!dateString) return "無"

  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}年${month}月${day}日 ${hours}:${minutes}`
}

/**
 * 取得訂單狀態的 Badge 樣式
 */
function getOrderStatusBadge(status: Order["status"]) {
  switch (status) {
    case "pending":
      return (
        <Badge className="bg-yellow-600 hover:bg-yellow-700 text-white">
          待付款
        </Badge>
      )
    case "paid":
      return (
        <Badge className="bg-green-600 hover:bg-green-700 text-white">
          已完成
        </Badge>
      )
    case "cancelled":
      return (
        <Badge className="bg-gray-600 hover:bg-gray-700 text-white">
          已取消
        </Badge>
      )
  }
}

/**
 * 檢查訂單是否已過期
 */
function isOrderExpired(order: Order): boolean {
  if (order.status !== "pending") return false
  return new Date() > new Date(order.payDeadline)
}

export default function ProfileOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)

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
          console.log('[ProfileOrdersPage] 登入狀態:', !!data.user)
        } else {
          setIsLoggedIn(false)
          // 如果未登入，導向登入頁
          router.push('/login?returnUrl=/profile/orders')
        }
      } catch (error) {
        console.error('[ProfileOrdersPage] 檢查登入狀態失敗:', error)
        setIsLoggedIn(false)
        router.push('/login?returnUrl=/profile/orders')
      }
    }
    checkLoginStatus()
  }, [router])

  // 獲取所有訂單
  useEffect(() => {
    async function fetchOrders() {
      if (!isLoggedIn) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const res = await fetch('/api/user/orders')
        if (res.ok) {
          const data = await res.json()
          setOrders(data)
          console.log('[ProfileOrdersPage] 取得訂單列表:', data)
        } else {
          console.error('[ProfileOrdersPage] 取得訂單失敗:', res.status)
          setOrders([])
        }
      } catch (error) {
        console.error('[ProfileOrdersPage] 取得訂單列表失敗:', error)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [isLoggedIn])

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="container max-w-7xl py-8 px-4">
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-yellow-600" />
            <CardTitle className="text-2xl">我的訂單</CardTitle>
          </div>
          <CardDescription>
            查看所有課程的訂單紀錄
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              載入訂單紀錄中...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              目前沒有訂單紀錄
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>訂單編號</TableHead>
                    <TableHead>課程名稱</TableHead>
                    <TableHead>付款日期</TableHead>
                    <TableHead>金額</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead>備註</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const expired = isOrderExpired(order)
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          {order.orderNo}
                        </TableCell>
                        <TableCell className="font-medium">
                          {order.courseTitle}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(order.paidAt)}
                        </TableCell>
                        <TableCell className="font-semibold text-blue-600">
                          NT$ {order.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {getOrderStatusBadge(order.status)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {order.memo || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {order.status === "pending" && !expired && (
                            <Button
                              size="sm"
                              onClick={() => router.push(`/orders/${order.orderNo}/payment`)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              立即完成訂單
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
