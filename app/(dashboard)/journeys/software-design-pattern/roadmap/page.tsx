/**
 * 軟體設計模式精通之旅 - 挑戰地圖頁面
 * 顯示學習路徑的視覺化地圖
 *
 * URL: /journeys/software-design-pattern/roadmap
 *
 * 特色:
 * - 使用 (dashboard) layout，保留側邊欄
 * - 隱藏 header 的課程篩選器和前往挑戰按鈕
 * - 顯示白段道館和黑段道館的挑戰列表（從 API 獲取真實資料）
 */
"use client";

import React, { useEffect, useState } from "react";
import { Star, Lock, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ChapterDetail, GymSummary } from "@/types/journey";

// 挑戰分類型別
interface CategorizedGyms {
  whiteMain: GymSummary[];    // 白段主線 (1-5)
  whiteExtra: GymSummary[];   // 白段支線 (4.A, 5.A, 5.B, 5.C)
  blackMain: GymSummary[];    // 黑段主線 (6-10)
  blackExtra: GymSummary[];   // 黑段支線 (6.A, 6.B, 6.C, 9.A, 9.B, 10.A)
}

export default function RoadmapPage() {
  const [chapters, setChapters] = useState<ChapterDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"main" | "extra">("main");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOwned, setIsOwned] = useState(false);

  // 從 API 獲取章節和 gyms 資料
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 檢查登入狀態
        const authResponse = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (authResponse.ok) {
          const authData = await authResponse.json();
          setIsAuthenticated(!!authData.user);
        }

        // 獲取課程資料
        const chaptersResponse = await fetch("/api/journeys/software-design-pattern/chapters", {
          credentials: "include",
        });

        if (chaptersResponse.ok) {
          const data: ChapterDetail[] = await chaptersResponse.json();
          setChapters(data);
        }

        // 獲取課程詳情以確認是否擁有
        const journeyResponse = await fetch("/api/journeys/software-design-pattern", {
          credentials: "include",
        });

        if (journeyResponse.ok) {
          const journeyData = await journeyResponse.json();
          setIsOwned(journeyData.isOwned || false);
        }
      } catch (error) {
        console.error("[Roadmap] 獲取資料失敗:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 從所有章節中提取並分類 gyms
  const categorizeGyms = (): CategorizedGyms => {
    const allGyms: GymSummary[] = [];

    // 收集所有 gyms
    chapters.forEach(chapter => {
      allGyms.push(...chapter.gyms);
    });

    const result: CategorizedGyms = {
      whiteMain: [],
      whiteExtra: [],
      blackMain: [],
      blackExtra: [],
    };

    allGyms.forEach(gym => {
      const code = gym.code || "";

      // 白段主線：code 為純數字 1-5
      if (/^[1-5]$/.test(code)) {
        result.whiteMain.push(gym);
      }
      // 白段支線：code 為 4.A, 5.A, 5.B, 5.C
      else if (/^[4-5]\.[A-Z]$/.test(code)) {
        result.whiteExtra.push(gym);
      }
      // 黑段主線：code 為純數字 6-10
      else if (/^([6-9]|10)$/.test(code)) {
        result.blackMain.push(gym);
      }
      // 黑段支線：code 為 6.A, 6.B, 6.C, 9.A, 9.B, 10.A
      else if (/^(6|9|10)\.[A-Z]$/.test(code)) {
        result.blackExtra.push(gym);
      }
    });

    // 按 code 排序
    const sortByCode = (a: GymSummary, b: GymSummary) => {
      const codeA = a.code || "";
      const codeB = b.code || "";
      return codeA.localeCompare(codeB, undefined, { numeric: true });
    };

    result.whiteMain.sort(sortByCode);
    result.whiteExtra.sort(sortByCode);
    result.blackMain.sort(sortByCode);
    result.blackExtra.sort(sortByCode);

    return result;
  };

  const categorized = categorizeGyms();
  const totalCleared = 0; // TODO: 從 API 獲取已完成數量
  const totalGyms =
    categorized.whiteMain.length +
    categorized.whiteExtra.length +
    categorized.blackMain.length +
    categorized.blackExtra.length;

  // 判斷道館是否鎖定（未登入或未購買課程）
  const isGymLocked = !isAuthenticated || !isOwned;

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* 頁面標題 */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 text-yellow-500">
          軟體設計模式精通之旅
        </h1>
        <p className="text-sm text-muted-foreground">挑戰地圖</p>
      </div>

      {/* 進度統計（三個放在同一個 border 裡面，三等份）*/}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="grid grid-cols-3 border rounded-lg overflow-hidden">
          <div className="flex items-center justify-center gap-2 px-4 py-3 border-r">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">0 days left</span>
          </div>
          <div className="flex items-center justify-center gap-2 px-4 py-3 border-r">
            <Star className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{totalCleared}/{totalGyms} cleared</span>
          </div>
          <div className="flex items-center justify-center gap-2 px-4 py-3">
            <span className="text-sm font-medium">📊 0 XP</span>
          </div>
        </div>
      </div>

      {/* 主線/支線 Tabs（寬度和統計區域一樣）*/}
      <div className="max-w-4xl mx-auto">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "main" | "extra")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto p-0 bg-transparent gap-4 mb-8">
            <TabsTrigger
              value="main"
              className={cn(
                "text-base py-3 rounded-lg data-[state=inactive]:bg-muted data-[state=inactive]:text-muted-foreground",
                "data-[state=active]:bg-yellow-600 data-[state=active]:text-black data-[state=active]:shadow-none"
              )}
            >
              主線
            </TabsTrigger>
            <TabsTrigger
              value="extra"
              className={cn(
                "text-base py-3 rounded-lg data-[state=inactive]:bg-muted data-[state=inactive]:text-muted-foreground",
                "data-[state=active]:bg-yellow-600 data-[state=active]:text-black data-[state=active]:shadow-none"
              )}
            >
              支線
            </TabsTrigger>
          </TabsList>

          {/* 主線內容 */}
          <TabsContent value="main" className="space-y-12 mt-0">
            {/* 白段道館 */}
            <div>
              <SectionTitle>白段道館</SectionTitle>
              <div className="space-y-0">
                {categorized.whiteMain.length > 0 ? (
                  categorized.whiteMain.map((gym, index) => (
                    <React.Fragment key={gym.id}>
                      <GymCard gym={gym} isLocked={isGymLocked} />
                      {/* 連接線（最後一個不顯示，直接接到卡片無間隔）*/}
                      {index < categorized.whiteMain.length - 1 && (
                        <div className="flex justify-center">
                          <div className="w-px h-4 bg-border"></div>
                        </div>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">暫無主線挑戰</p>
                )}
              </div>
            </div>

            {/* 黑段道館 */}
            <div>
              <SectionTitle>黑段道館</SectionTitle>
              <div className="space-y-0">
                {categorized.blackMain.length > 0 ? (
                  categorized.blackMain.map((gym, index) => (
                    <React.Fragment key={gym.id}>
                      <GymCard gym={gym} isLocked={isGymLocked} />
                      {/* 連接線（最後一個不顯示，直接接到卡片無間隔）*/}
                      {index < categorized.blackMain.length - 1 && (
                        <div className="flex justify-center">
                          <div className="w-px h-4 bg-border"></div>
                        </div>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">暫無主線挑戰</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* 支線內容 */}
          <TabsContent value="extra" className="space-y-12 mt-0">
            {/* 白段道館 */}
            <div>
              <SectionTitle>白段道館</SectionTitle>
              <div className="space-y-0">
                {categorized.whiteExtra.length > 0 ? (
                  categorized.whiteExtra.map((gym, index) => (
                    <React.Fragment key={gym.id}>
                      <GymCard gym={gym} isLocked={isGymLocked} />
                      {/* 連接線（最後一個不顯示，直接接到卡片無間隔）*/}
                      {index < categorized.whiteExtra.length - 1 && (
                        <div className="flex justify-center">
                          <div className="w-px h-4 bg-border"></div>
                        </div>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">暫無支線挑戰</p>
                )}
              </div>
            </div>

            {/* 黑段道館 */}
            <div>
              <SectionTitle>黑段道館</SectionTitle>
              <div className="space-y-0">
                {categorized.blackExtra.length > 0 ? (
                  categorized.blackExtra.map((gym, index) => (
                    <React.Fragment key={gym.id}>
                      <GymCard gym={gym} isLocked={isGymLocked} />
                      {/* 連接線（最後一個不顯示，直接接到卡片無間隔）*/}
                      {index < categorized.blackExtra.length - 1 && (
                        <div className="flex justify-center">
                          <div className="w-px h-4 bg-border"></div>
                        </div>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">暫無支線挑戰</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// 區段標題組件（兩側加橫線）
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="flex-1 border-t"></div>
      <h2 className="text-xl font-bold whitespace-nowrap">{children}</h2>
      <div className="flex-1 border-t"></div>
    </div>
  );
}

// 道館卡片組件
function GymCard({ gym, isLocked }: { gym: GymSummary; isLocked: boolean }) {
  const hasSubCode = gym.code?.includes('.');

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg border bg-card transition-colors",
        isLocked ? "opacity-60" : "hover:bg-accent/50 cursor-pointer"
      )}
    >
      {/* 編號徽章 */}
      <div className="flex-shrink-0 relative">
        {hasSubCode ? (
          // 支線任務：與主線相同大小，縮小字體
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center relative">
            <span className="text-xs font-bold whitespace-nowrap">
              {gym.code}
            </span>
            {/* 鎖定圖標（右上角，透明背景，放大，線條式灰色）*/}
            {isLocked && (
              <div className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center">
                <Lock className="w-4 h-4 text-gray-500" />
              </div>
            )}
          </div>
        ) : (
          // 主線任務：正常大小
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center relative">
            <span className="text-lg font-bold">{gym.code || gym.orderIndex}</span>
            {/* 鎖定圖標（右上角，透明背景，放大，線條式灰色）*/}
            {isLocked && (
              <div className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center">
                <Lock className="w-4 h-4 text-gray-500" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 挑戰標題 */}
      <div className="flex-1">
        <h3 className="font-medium">{gym.name}</h3>
      </div>

      {/* 難度星標 */}
      <div className="flex gap-1">
        {Array.from({ length: gym.difficulty }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
        ))}
      </div>
    </div>
  );
}
