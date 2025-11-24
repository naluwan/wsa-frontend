"use client"

/**
 * 登入提示對話框（Login Dialog）
 * 當未登入使用者嘗試購買課程或觀看課程時顯示
 * 提供前往登入頁面的連結，並記住返回 URL
 */

import { useRouter, usePathname } from "next/navigation"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  returnUrl?: string  // 登入後要返回的 URL
}

export function LoginDialog({ open, onOpenChange, returnUrl }: LoginDialogProps) {
  const router = useRouter()
  const pathname = usePathname()

  console.log("[LoginDialog] open 狀態:", open)

  const handleLogin = () => {
    // 使用傳入的 returnUrl，或使用當前頁面路徑
    const targetReturnUrl = returnUrl || pathname
    console.log("[LoginDialog] 導向登入頁，returnUrl:", targetReturnUrl)
    // 將返回 URL 編碼為 query parameter
    router.push(`/login?returnUrl=${encodeURIComponent(targetReturnUrl)}`)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        {/* 關閉按鈕 */}
        <button
          onClick={() => onOpenChange(false)}
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
            onClick={handleLogin}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8"
            size="lg"
          >
            前往登入
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
