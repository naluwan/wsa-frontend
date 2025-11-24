"use client"

/**
 * 登入提示對話框（Login Dialog）
 * 當未登入使用者嘗試購買課程時顯示
 * 提供前往登入頁面的連結
 */

import { useRouter } from "next/navigation"
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

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseTitle: string
}

export function LoginDialog({ open, onOpenChange, courseTitle }: LoginDialogProps) {
  const router = useRouter()

  const handleLogin = () => {
    router.push("/login")
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>需要登入才能購買課程</AlertDialogTitle>
          <AlertDialogDescription>
            您需要先登入帳號，才能購買「{courseTitle}」課程。
            <br />
            如果還沒有帳號，您可以先註冊一個新帳號。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogin}>前往登入</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
