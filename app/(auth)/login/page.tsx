/**
 * 登入頁面（Login Page）
 *
 * 功能說明：
 * - 提供 OAuth 登入選項（Google 和 Facebook）
 * - 檢查使用者是否已登入，若已登入則顯示提示訊息
 * - 點擊登入按鈕會導向對應的 OAuth 提供者進行授權
 *
 * OAuth 流程：
 * 1. 使用者點擊 Google / Facebook 登入按鈕
 * 2. 導向 OAuth 提供者授權頁面
 * 3. 授權完成後導回 callback route
 * 4. callback route 呼叫後端 /api/auth/oauth-login
 * 5. 後端產生 JWT token 並設定到 httpOnly cookie
 * 6. 導回首頁，Header 自動顯示使用者資訊
 */
"use client";

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User as UserIcon } from "lucide-react"

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

export default function LoginPage() {
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get("returnUrl") || "/"  // 取得返回 URL，預設為首頁
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * 檢查使用者是否已登入
   *
   * 資料來源：/api/auth/me（真實資料）
   */
  useEffect(() => {
    const checkLoginStatus = async () => {
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
        console.error("[LoginPage] 檢查登入狀態失敗:", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkLoginStatus()
  }, [])

  /**
   * 處理 Google 登入
   * 建立 Google OAuth 授權 URL 並導向
   */
  const handleGoogleLogin = () => {
    // OAuth Redirect URI，需要包含 returnUrl 以便登入後返回
    const baseRedirectUri = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
      : "http://localhost:3000/api/auth/google/callback";

    const redirectUri = `${baseRedirectUri}?returnUrl=${encodeURIComponent(returnUrl)}`;

    // 建立 Google OAuth 授權 URL
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.append(
      "client_id",
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""
    );
    googleAuthUrl.searchParams.append("redirect_uri", baseRedirectUri);  // OAuth redirect_uri 不包含 returnUrl
    googleAuthUrl.searchParams.append("response_type", "code");
    googleAuthUrl.searchParams.append("scope", "openid email profile");
    googleAuthUrl.searchParams.append("state", encodeURIComponent(returnUrl));  // 使用 state 參數傳遞 returnUrl

    // 導向 Google 授權頁面
    window.location.href = googleAuthUrl.toString();
  };

  /**
   * 處理 Facebook 登入
   * 建立 Facebook OAuth 授權 URL 並導向
   */
  const handleFacebookLogin = () => {
    // OAuth Redirect URI
    const baseRedirectUri = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`
      : "http://localhost:3000/api/auth/facebook/callback";

    // 建立 Facebook OAuth 授權 URL
    const facebookAuthUrl = new URL(
      "https://www.facebook.com/v18.0/dialog/oauth"
    );
    facebookAuthUrl.searchParams.append(
      "client_id",
      process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ""
    );
    facebookAuthUrl.searchParams.append("redirect_uri", baseRedirectUri);
    facebookAuthUrl.searchParams.append("scope", "public_profile,email");
    facebookAuthUrl.searchParams.append("state", encodeURIComponent(returnUrl));  // 使用 state 參數傳遞 returnUrl

    // 導向 Facebook 授權頁面
    window.location.href = facebookAuthUrl.toString();
  };

  // 載入中狀態
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">檢查登入狀態中...</p>
        </div>
      </div>
    )
  }

  // 已登入狀態 - 顯示提示訊息
  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">你已登入</CardTitle>
            <CardDescription>
              你目前已經登入為以下帳號
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 使用者資訊卡片 */}
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || "使用者"} />
                <AvatarFallback>
                  <UserIcon className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-lg">
                  {user.displayName || "使用者"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user.email}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {user.provider === "google" ? "Google" : "Facebook"} 登入
                </p>
              </div>
            </div>

            {/* 操作按鈕 */}
            <div className="space-y-2">
              <Button asChild className="w-full" size="lg">
                <Link href="/" className="inline-flex items-center justify-center w-full h-full">
                  前往首頁
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full" size="lg">
                <Link href="/profile" className="inline-flex items-center justify-center w-full h-full">
                  查看個人檔案
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 未登入狀態 - 顯示登入選項
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a1f2e] p-4">
      <Card className="w-full max-w-md bg-[#2a3142] border-[#3a4152]">
        <CardHeader className="space-y-6 text-center">
          {/* Logo 和網站名稱 */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16 flex-shrink-0">
                <Image
                  src="/images/logo.png"
                  alt="WSA Logo"
                  width={64}
                  height={64}
                  className="rounded-lg"
                />
              </div>
              <div className="text-left">
                <p className="text-xl font-bold text-white">水球軟體學院</p>
                <p className="text-sm text-gray-400">WATERBALLSA.TW</p>
              </div>
            </div>
          </div>

          <CardTitle className="text-xl font-medium text-white">
            請選擇登入方式
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-8 pb-8">
          {/* Facebook 登入按鈕 */}
          <Button
            onClick={handleFacebookLogin}
            className="w-full bg-[#5b7ceb] hover:bg-[#4a6bd8] text-white"
            size="lg"
          >
            <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            使用 Facebook 登入
          </Button>

          {/* Google 登入按鈕 */}
          <Button
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-gray-100 text-gray-900"
            size="lg"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            使用 Google 登入
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
