/**
 * MobileSidebar 組件 - 手機版側邊欄
 * 使用 Sheet 從左側滑出
 *
 * 導覽連結說明：
 * - 「課程」(/courses)：課程列表頁（主要入口，顯示所有課程 card）
 * - 「所有單元」(/journeys)：目前選取課程的章節＋單元總覽頁（依賴 currentCourse context）
 *   注意：需要先在 /courses 選擇課程後，此頁面才能正常顯示內容
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Home,
  BookOpen,
  Trophy,
  Grid3x3,
  FileText,
  User,
  Gift,
  LineChart,
  Map,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCourse } from "@/contexts/course-context";

// 軟體設計模式精通之旅的導覽項目
const designPatternsNavGroups = [
  {
    items: [
      {
        title: "首頁",
        href: "/",
        icon: Home,
      },
      {
        title: "課程",
        href: "/courses",
        icon: BookOpen,
      },
      {
        title: "個人檔案",
        href: "/users/me/profile",
        icon: User,
      },
    ],
  },
  {
    items: [
      {
        title: "排行榜",
        href: "/leaderboard",
        icon: Trophy,
      },
      {
        title: "獎勵任務",
        href: "/rewards",
        icon: Gift,
      },
      {
        title: "挑戰歷程",
        href: "/users/me/portfolio",
        icon: LineChart,
      },
    ],
  },
  {
    items: [
      {
        title: "所有單元",
        href: "/journeys",
        icon: Grid3x3,
      },
      {
        title: "挑戰地圖",
        href: "/journeys/software-design-pattern/roadmap",
        icon: Map,
      },
      {
        title: "SOP 寶典",
        href: "/sop",
        icon: FileText,
      },
    ],
  },
];

// AI x BDD 課程的導覽項目
const aiBddNavGroups = [
  {
    items: [
      {
        title: "首頁",
        href: "/",
        icon: Home,
      },
      {
        title: "課程",
        href: "/courses",
        icon: BookOpen,
      },
      {
        title: "個人檔案",
        href: "/users/me/profile",
        icon: User,
      },
    ],
  },
  {
    items: [
      {
        title: "排行榜",
        href: "/leaderboard",
        icon: Trophy,
      },
    ],
  },
  {
    items: [
      {
        title: "所有單元",
        href: "/journeys",
        icon: Grid3x3,
      },
      {
        title: "Prompt 寶典",
        href: "/sop",
        icon: Sparkles,
      },
    ],
  },
];

interface MobileSidebarProps {
  children: React.ReactNode;
}

export function MobileSidebar({ children }: MobileSidebarProps) {
  const pathname = usePathname();
  const { currentCourse } = useCourse();
  const [open, setOpen] = React.useState(false);

  // 根據當前課程選擇導航項目
  // AI x BDD 課程使用 slug "ai-x-bdd"
  const navGroups = currentCourse?.slug === "ai-x-bdd"
    ? aiBddNavGroups
    : designPatternsNavGroups;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0 [&>button]:hidden">
        {/* 側邊欄內容 */}
        <nav className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 px-4 py-3">
            <Link href="/" className="flex items-center gap-3 w-full" onClick={() => setOpen(false)}>
              {/* Logo 圖片 */}
              <div className="flex-shrink-0">
                <Image
                  src="/images/logo.png"
                  alt="WSA"
                  width={48}
                  height={48}
                  className="rounded-lg"
                />
              </div>
              {/* 文字部分 */}
              <div className="flex flex-col justify-center overflow-hidden">
                <span className="text-sm font-bold text-foreground whitespace-nowrap">
                  水球軟體學院
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  WATERBALLSA.TW
                </span>
              </div>
            </Link>
          </div>

          {/* 導覽項目分組 */}
          <div className="flex-1 overflow-y-auto">
            {navGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* 分組分隔線（第一組除外）*/}
                {groupIndex > 0 && <div className="border-t mx-2 my-2" />}

                {/* 分組內的項目 */}
                <div className="py-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    // 特別處理 /journeys：只在完全匹配時才算 active，避免與子路徑（如 roadmap）衝突
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/" && item.href !== "/journeys" && pathname.startsWith(item.href + "/"));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-lg transition-colors",
                          "text-foreground hover:bg-accent hover:text-accent-foreground",
                          isActive &&
                            "bg-accent text-accent-foreground font-medium"
                        )}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="text-inherit">{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
