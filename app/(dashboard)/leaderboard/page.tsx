"use client"

/**
 * 排行榜頁面（Leaderboard Page）
 * 顯示學習排行榜與本週成長榜
 * 包含：
 * 1. 兩個 Tab（學習排行榜、本週成長榜）
 * 2. 排名表格（排名、頭像、名稱、等級、XP）
 * 3. 前三名特殊圖示（金銀銅）
 * 4. 無限滾動（初始顯示 5 筆，下滑載入更多 20 筆）
 * 5. 底部固定顯示當前使用者排名（藍色高亮）
 *
 * 資料來源：後端 API /api/leaderboard/total/v2 和 /api/leaderboard/weekly/v2
 */
import { useEffect, useState, useRef, useCallback } from "react"
import { Trophy, Medal, Award } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * 使用者排行資料型別（對應後端 LeaderboardEntryDto）
 */
interface LeaderboardUser {
  rank: string  // 排名可以是數字字串或 "-"（未上榜）
  userId: string
  displayName: string
  avatarUrl: string | null
  level: number
  totalXp: number
  weeklyXp: number
}

/**
 * 排行榜回應型別（對應後端 LeaderboardResponseDto）
 */
interface LeaderboardResponse {
  leaderboard: LeaderboardUser[]
  currentUserEntry: LeaderboardUser | null
  total: number
  hasMore: boolean
}

// 取得排名圖示（前三名）
function getRankIcon(rank: string) {
  switch (rank) {
    case "1":
      return <Trophy className="h-6 w-6 text-yellow-500" />
    case "2":
      return <Medal className="h-6 w-6 text-gray-400" />
    case "3":
      return <Award className="h-6 w-6 text-amber-700" />
    default:
      return <span className="text-muted-foreground font-medium">{rank}</span>
  }
}

// 取得等級顏色
function getLevelColor(level: number): "default" | "secondary" | "destructive" {
  if (level >= 15) return "destructive"
  if (level >= 10) return "default"
  return "secondary"
}

/**
 * 排行榜表格組件
 */
function LeaderboardTable({
  users,
  showWeeklyXp,
  loading,
  currentUser,
  onEndReached,
  hasMore,
  loadingMore
}: {
  users: LeaderboardUser[];
  showWeeklyXp?: boolean;
  loading?: boolean;
  currentUser?: LeaderboardUser | null;
  onEndReached?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}) {
  const observerTarget = useRef<HTMLDivElement>(null)

  // Debug: 記錄收到的 users 資料
  useEffect(() => {
    console.log(`[LeaderboardTable] 收到 users 資料 - 人數: ${users.length}, showWeeklyXp: ${showWeeklyXp}`);
    if (users.length > 0) {
      console.log(`[LeaderboardTable] 前 10 名排名:`, users.slice(0, 10).map(u => u.rank).join(', '));
    }
  }, [users, showWeeklyXp]);

  // 設定 Intersection Observer 來偵測滾動到底部
  useEffect(() => {
    if (!onEndReached || !hasMore || loadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onEndReached()
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [onEndReached, hasMore, loadingMore])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">載入中...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">暫無排行資料</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 排行榜表格 */}
      <div className="max-h-[600px] overflow-y-auto rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-[80px]">排名</TableHead>
              <TableHead>使用者</TableHead>
              <TableHead className="text-center">等級</TableHead>
              <TableHead className="text-right">總 XP</TableHead>
              {showWeeklyXp && <TableHead className="text-right">本週 XP</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.userId}>
                {/* 排名 */}
                <TableCell className="font-medium">
                  <div className="flex items-center justify-center">
                    {getRankIcon(user.rank)}
                  </div>
                </TableCell>

                {/* 使用者資訊 */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName} />
                      <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.displayName}</span>
                  </div>
                </TableCell>

                {/* 等級 */}
                <TableCell className="text-center">
                  <Badge variant={getLevelColor(user.level)}>
                    Lv {user.level}
                  </Badge>
                </TableCell>

                {/* 總 XP */}
                <TableCell className="text-right font-medium">
                  {user.totalXp.toLocaleString()}
                </TableCell>

                {/* 本週 XP */}
                {showWeeklyXp && (
                  <TableCell className="text-right font-medium text-primary">
                    +{user.weeklyXp.toLocaleString()}
                  </TableCell>
                )}
              </TableRow>
            ))}

            {/* 載入更多指示器 */}
            {hasMore && (
              <TableRow>
                <TableCell colSpan={showWeeklyXp ? 5 : 4}>
                  <div ref={observerTarget} className="flex items-center justify-center py-4">
                    {loadingMore ? (
                      <p className="text-sm text-muted-foreground">載入更多...</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">下滑以載入更多</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 當前使用者排名（固定在底部，藍色高亮） */}
      {currentUser && (
        <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {/* 排名 */}
                <div className="flex items-center justify-center w-[80px]">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                    #{currentUser.rank}
                  </span>
                </div>

                {/* 使用者資訊 */}
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-10 w-10 border-2 border-blue-500">
                    <AvatarImage src={currentUser.avatarUrl || undefined} alt={currentUser.displayName} />
                    <AvatarFallback className="bg-blue-100 dark:bg-blue-900">
                      {currentUser.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                      {currentUser.displayName}
                      <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(你)</span>
                    </p>
                  </div>
                </div>

                {/* 等級 */}
                <div className="text-center">
                  <Badge variant={getLevelColor(currentUser.level)} className="border-blue-500">
                    Lv {currentUser.level}
                  </Badge>
                </div>

                {/* 總 XP */}
                <div className="text-right font-semibold text-blue-900 dark:text-blue-100 min-w-[100px]">
                  {currentUser.totalXp.toLocaleString()}
                </div>

                {/* 本週 XP */}
                {showWeeklyXp && (
                  <div className="text-right font-semibold text-blue-600 dark:text-blue-400 min-w-[100px]">
                    +{currentUser.weeklyXp.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function LeaderboardPage() {
  const [totalXpData, setTotalXpData] = useState<LeaderboardResponse | null>(null);
  const [weeklyXpData, setWeeklyXpData] = useState<LeaderboardResponse | null>(null);
  const [loadingTotal, setLoadingTotal] = useState(true);
  const [loadingWeekly, setLoadingWeekly] = useState(true);
  const [loadingMoreTotal, setLoadingMoreTotal] = useState(false);
  const [loadingMoreWeekly, setLoadingMoreWeekly] = useState(false);
  const [offsetTotal, setOffsetTotal] = useState(0);
  const [offsetWeekly, setOffsetWeekly] = useState(0);

  // 載入總排行榜（初始載入 5 筆）
  useEffect(() => {
    console.log('[useEffect] 總排行榜初始載入觸發');
    fetchTotalLeaderboard(0, 5, true);
  }, []);

  // 載入週排行榜（初始載入 5 筆）
  useEffect(() => {
    fetchWeeklyLeaderboard(0, 5, true);
  }, []);

  /**
   * 取得總排行榜資料
   */
  const fetchTotalLeaderboard = async (offset: number, limit: number, isInitial: boolean = false) => {
    try {
      console.log(`[fetchTotalLeaderboard] 開始請求 - offset: ${offset}, limit: ${limit}, isInitial: ${isInitial}`);

      if (isInitial) {
        setLoadingTotal(true);
      } else {
        setLoadingMoreTotal(true);
      }

      const res = await fetch(`/api/leaderboard/total/v2?limit=${limit}&offset=${offset}`);

      if (!res.ok) {
        console.error("[leaderboard/page] 取得總排行榜失敗:", res.status);
        return;
      }

      const data: LeaderboardResponse = await res.json();
      console.log(`[fetchTotalLeaderboard] 收到資料 - 排行榜人數: ${data.leaderboard?.length}, hasMore: ${data.hasMore}, total: ${data.total}`);
      console.log(`[fetchTotalLeaderboard] 排行榜前 3 名:`, data.leaderboard?.slice(0, 3).map(u => `#${u.rank} ${u.displayName}`));
      console.log(`[fetchTotalLeaderboard] currentUserEntry:`, data.currentUserEntry ? `#${data.currentUserEntry.rank} ${data.currentUserEntry.displayName}` : 'null');

      if (isInitial) {
        console.log(`[fetchTotalLeaderboard] 初始載入 - 直接設定資料`);
        setTotalXpData(data);
        setOffsetTotal(limit);
      } else {
        // 追加資料（保留原有的 currentUserEntry）
        console.log(`[fetchTotalLeaderboard] 追加載入 - 合併資料`);
        setTotalXpData(prev => {
          const newData = prev ? {
            leaderboard: [...prev.leaderboard, ...data.leaderboard],
            currentUserEntry: prev.currentUserEntry,
            total: data.total,
            hasMore: data.hasMore,
          } : data;
          console.log(`[fetchTotalLeaderboard] 合併後排行榜人數: ${newData.leaderboard.length}`);
          console.log(`[fetchTotalLeaderboard] 合併後前 10 名:`, newData.leaderboard.slice(0, 10).map(u => `#${u.rank}`).join(', '));
          return newData;
        });
        setOffsetTotal(prev => prev + limit);
      }
    } catch (err) {
      console.error("[leaderboard/page] 取得總排行榜錯誤:", err);
    } finally {
      setLoadingTotal(false);
      setLoadingMoreTotal(false);
    }
  };

  /**
   * 取得週排行榜資料
   */
  const fetchWeeklyLeaderboard = async (offset: number, limit: number, isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setLoadingWeekly(true);
      } else {
        setLoadingMoreWeekly(true);
      }

      const res = await fetch(`/api/leaderboard/weekly/v2?limit=${limit}&offset=${offset}`);

      if (!res.ok) {
        console.error("[leaderboard/page] 取得週排行榜失敗:", res.status);
        return;
      }

      const data: LeaderboardResponse = await res.json();

      if (isInitial) {
        setWeeklyXpData(data);
        setOffsetWeekly(limit);
      } else {
        // 追加資料（保留原有的 currentUserEntry）
        setWeeklyXpData(prev => prev ? {
          leaderboard: [...prev.leaderboard, ...data.leaderboard],
          currentUserEntry: prev.currentUserEntry,
          total: data.total,
          hasMore: data.hasMore,
        } : data);
        setOffsetWeekly(prev => prev + limit);
      }
    } catch (err) {
      console.error("[leaderboard/page] 取得週排行榜錯誤:", err);
    } finally {
      setLoadingWeekly(false);
      setLoadingMoreWeekly(false);
    }
  };

  /**
   * 載入更多總排行榜資料
   */
  const loadMoreTotal = useCallback(() => {
    if (!loadingMoreTotal && totalXpData?.hasMore) {
      fetchTotalLeaderboard(offsetTotal, 20);
    }
  }, [loadingMoreTotal, totalXpData?.hasMore, offsetTotal]);

  /**
   * 載入更多週排行榜資料
   */
  const loadMoreWeekly = useCallback(() => {
    if (!loadingMoreWeekly && weeklyXpData?.hasMore) {
      fetchWeeklyLeaderboard(offsetWeekly, 20);
    }
  }, [loadingMoreWeekly, weeklyXpData?.hasMore, offsetWeekly]);

  return (
    <div className="flex flex-col">
      {/* 頁面標題 */}
      <section className="w-full py-12 md:py-16 bg-gradient-to-b from-muted/50 to-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <Trophy className="h-16 w-16 text-primary" />
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              排行榜
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              與全站學員一同競爭，展現你的學習成果！
            </p>
          </div>
        </div>
      </section>

      {/* 排行榜內容 */}
      <section className="w-full py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <Tabs defaultValue="total" className="max-w-5xl mx-auto">
            {/* Tab 選單 */}
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="total">學習排行榜</TabsTrigger>
              <TabsTrigger value="weekly">本週成長榜</TabsTrigger>
            </TabsList>

            {/* 學習排行榜（總 XP） */}
            <TabsContent value="total">
              <Card>
                <CardHeader>
                  <CardTitle>學習排行榜</CardTitle>
                  <CardDescription>
                    依照總獲得 XP 排序，展現長期學習成果
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LeaderboardTable
                    users={totalXpData?.leaderboard || []}
                    loading={loadingTotal}
                    currentUser={totalXpData?.currentUserEntry}
                    onEndReached={loadMoreTotal}
                    hasMore={totalXpData?.hasMore}
                    loadingMore={loadingMoreTotal}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* 本週成長榜（本週 XP） */}
            <TabsContent value="weekly">
              <Card>
                <CardHeader>
                  <CardTitle>本週成長榜</CardTitle>
                  <CardDescription>
                    依照本週獲得 XP 排序，鼓勵持續學習
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LeaderboardTable
                    users={weeklyXpData?.leaderboard || []}
                    showWeeklyXp
                    loading={loadingWeekly}
                    currentUser={weeklyXpData?.currentUserEntry}
                    onEndReached={loadMoreWeekly}
                    hasMore={weeklyXpData?.hasMore}
                    loadingMore={loadingMoreWeekly}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* 額外資訊 */}
          <div className="mt-8 text-center text-sm text-muted-foreground max-w-5xl mx-auto">
            <p>
              排行榜每小時更新一次。持續學習、完成單元以提升你的排名！
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
