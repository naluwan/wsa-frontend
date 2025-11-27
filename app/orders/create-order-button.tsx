// ==============================================================================
// DEPRECATED:
// 本元件已被 app/(journey)/journeys/[slug]/orders/create-order-button.tsx 取代。
// 目前暫時保留以利比對與回滾，請勿再新開發時使用此元件。
// ==============================================================================

"use client"

/**
 * 建立訂單按鈕元件（已棄用）
 * - 檢查登入狀態
 * - 如果未登入，顯示登入提醒對話框
 * - 如果已登入，呼叫 POST /api/orders API 建立訂單，然後導向付款頁面
 *
 * @deprecated 請使用 app/(journey)/journeys/[slug]/orders/create-order-button.tsx
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
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

interface CreateOrderButtonProps {
  courseId: string
}

export function CreateOrderButton({ courseId }: CreateOrderButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [showLoginAlert, setShowLoginAlert] = useState(false)

  // 檢查登入狀態
  useEffect(() => {
    async function checkLoginStatus() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        })
        if (res.ok) {
          const data = await res.json()
          setIsLoggedIn(!!data.user)
          console.log("[CreateOrderButton] 登入狀態:", !!data.user)
        } else {
          setIsLoggedIn(false)
        }
      } catch (error) {
        console.error("[CreateOrderButton] 檢查登入狀態失敗:", error)
        setIsLoggedIn(false)
      }
    }
    checkLoginStatus()
  }, [])

  const handleCreateOrder = async () => {
    // 如果未登入，顯示登入提醒對話框
    if (!isLoggedIn) {
      console.log("[CreateOrderButton] 未登入，顯示登入提醒")
      setShowLoginAlert(true)
      return
    }

    try {
      setIsCreating(true)

      // 呼叫建立訂單 API
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId }),
      })

      if (!res.ok) {
        const error = await res.json()
        toast({
          title: "建立訂單失敗",
          description: error.error || "發生未知錯誤",
          variant: "destructive",
        })
        return
      }

      const data = await res.json()
      const orderNo = data.orderNo

      // 導向付款頁面
      router.push(`/orders/${orderNo}/payment`)
    } catch (error) {
      console.error("[CreateOrderButton] 建立訂單錯誤:", error)
      toast({
        title: "建立訂單失敗",
        description: "網路連線錯誤，請稍後再試",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleLoginClick = () => {
    // 導向登入頁面，並設定返回 URL
    const currentUrl = window.location.href
    router.push(`/login?returnUrl=${encodeURIComponent(currentUrl)}`)
  }

  return (
    <>
      <Button
        onClick={handleCreateOrder}
        disabled={isCreating}
        size="lg"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        data-testid="create-order-button"
      >
        {isCreating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            處理中...
          </>
        ) : (
          "下一步：選取付款方式"
        )}
      </Button>

      {/* 登入提醒對話框 */}
      <AlertDialog open={showLoginAlert} onOpenChange={setShowLoginAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>請先登入</AlertDialogTitle>
            <AlertDialogDescription>
              建立訂單需要登入帳號。登入後，您可以繼續購買課程。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLoginClick}
              className="bg-blue-600 hover:bg-blue-700"
            >
              前往登入
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
