/**
 * AppSidebar 組件 - 應用側邊欄
 * 左側可收合的導覽側邊欄
 * 根據當前選擇的課程動態顯示不同的導航項目
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Trophy,
  Grid3x3,
  FileText,
  ChevronLeft,
  ChevronRight,
  User,
  Gift,
  LineChart,
  Map,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";
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
        href: "/profile",
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
        href: "/journeys",
        icon: LineChart,
      },
    ],
  },
  {
    items: [
      {
        title: "所有單元",
        href: "/units",
        icon: Grid3x3,
      },
      {
        title: "挑戰地圖",
        href: "/map",
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
        href: "/profile",
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
        href: "/units",
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

// 未登入時的導覽項目（軟體設計模式精通之旅）
const unauthenticatedDesignPatternsNavGroups = [
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
        href: "/units",
        icon: Grid3x3,
      },
      {
        title: "挑戰地圖",
        href: "/map",
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

// 未登入時的導覽項目（AI x BDD 課程）
const unauthenticatedAiBddNavGroups = [
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
        href: "/units",
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

interface AppSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isAuthenticated?: boolean;
}

export function AppSidebar({ isCollapsed, onToggle, isAuthenticated = true }: AppSidebarProps) {
  const pathname = usePathname();
  const { currentCourse } = useCourse();

  // 根據當前課程和登入狀態選擇導航項目
  const navGroups = isAuthenticated
    ? (currentCourse.id === "AI_BDD" ? aiBddNavGroups : designPatternsNavGroups)
    : (currentCourse.id === "AI_BDD" ? unauthenticatedAiBddNavGroups : unauthenticatedDesignPatternsNavGroups);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-background border-r transition-all duration-300 z-50",
        "hidden lg:block", // 手機版隱藏，桌面版顯示
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* 側邊欄內容 */}
      <nav className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center h-20 px-4 py-3">
          <Link href="/" className="flex items-center gap-3 w-full">
            {!isCollapsed ? (
              <>
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
              </>
            ) : (
              /* 收合狀態：只顯示 Logo */
              <div className="flex-shrink-0">
                <Image
                  src="/images/logo.png"
                  alt="WSA"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
              </div>
            )}
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
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href + "/"));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-lg transition-colors",
                        "text-foreground hover:bg-accent hover:text-accent-foreground",
                        isActive &&
                          "bg-accent text-accent-foreground font-medium",
                        isCollapsed && "justify-center px-2"
                      )}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="text-inherit">{item.title}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 收合按鈕 */}
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="w-full"
            aria-label={isCollapsed ? "展開側邊欄" : "收合側邊欄"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </nav>
    </aside>
  );
}
