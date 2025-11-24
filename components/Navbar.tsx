"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

/**
 * 使用者資料介面
 */
interface UserData {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  level: number;
  totalXp: number;
  weeklyXp: number;
}

/**
 * 導覽列元件
 *
 * 顯示應用程式標題和使用者登入狀態
 * - 未登入：顯示「登入」按鈕
 * - 已登入：顯示使用者頭像和名稱
 */
export default function Navbar() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // 元件掛載時，取得當前使用者資料
  useEffect(() => {
    fetchUser();
  }, []);

  /**
   * 向 /api/auth/me 請求當前使用者資料
   */
  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* 應用程式標題 */}
        <Link
          href="/"
          className="text-2xl font-bold text-foreground hover:text-primary transition-colors"
        >
          WSA
        </Link>

        {/* 使用者登入狀態顯示區 */}
        <div>
          {loading ? (
            // 載入中狀態
            <div className="text-muted-foreground">載入中...</div>
          ) : user ? (
            // 已登入：顯示使用者頭像和名稱
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground">
                {user.displayName}
              </span>
            </div>
          ) : (
            // 未登入：顯示登入按鈕
            <Link href="/login">
              <Button>登入</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
