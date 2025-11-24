"use client"

/**
 * 購買課程按鈕（Client Component）
 * 處理購買課程的互動邏輯：
 * - 點擊購買按鈕
 * - 檢查登入狀態（401 → 顯示登入提示）
 * - 呼叫購買 API
 * - 顯示 Toast 通知
 * - 重新整理頁面
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ShoppingCart } from "lucide-react"
import { LoginDialog } from "./login-dialog"

interface PurchaseButtonProps {
  courseCode: string
  courseTitle: string
}

export function PurchaseButton({ courseCode, courseTitle }: PurchaseButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  const handlePurchase = async () => {
    try {
      setIsPurchasing(true)

      const res = await fetch(`/api/courses/${courseCode}/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      // 若未登入，顯示登入提示對話框
      if (res.status === 401) {
        setShowLoginDialog(true)
        return
      }

      if (!res.ok) {
        const error = await res.json()
        toast({
          title: "購買失敗",
          description: error.error || "發生未知錯誤，請稍後再試",
          variant: "destructive",
        })
        return
      }

      // 購買成功
      const data = await res.json()
      toast({
        title: "購買成功！",
        description: `您已成功購買「${courseTitle}」，所有單元已解鎖！`,
      })

      // 重新整理頁面以更新課程擁有狀態
      router.refresh()
    } catch (error) {
      console.error("[PurchaseButton] 購買發生錯誤:", error)
      toast({
        title: "購買失敗",
        description: "網路連線錯誤，請稍後再試",
        variant: "destructive",
      })
    } finally {
      setIsPurchasing(false)
    }
  }

  return (
    <>
      <Button
        onClick={handlePurchase}
        disabled={isPurchasing}
        size="lg"
        className="gap-2"
      >
        <ShoppingCart className="h-5 w-5" />
        {isPurchasing ? "處理中..." : "購買課程"}
      </Button>

      {/* 登入提示對話框 */}
      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        courseTitle={courseTitle}
      />
    </>
  )
}
