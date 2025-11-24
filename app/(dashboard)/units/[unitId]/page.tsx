"use client"

/**
 * 單元頁面（Unit Page）
 * 顯示單元影片與學習內容，包含：
 * - 單元標題與課程資訊
 * - 影片播放器
 * - 完成單元按鈕（獲得 XP）
 * - 完成狀態提示
 *
 * 資料來源：後端 API /api/units/{unitId}（真實資料）
 */
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, Trophy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

/**
 * 單元資料型別（對應後端 UnitDto）
 */
interface UnitDetail {
  id: string;
  unitId: string;
  courseCode: string;
  title: string;
  type: string;
  orderIndex: number;
  videoUrl: string;
  xpReward: number;
  isCompleted: boolean;
}

/**
 * 完成單元回應型別（對應後端 CompleteUnitResponseDto）
 */
interface CompleteUnitResponse {
  user: {
    id: string;
    level: number;
    totalXp: number;
    weeklyXp: number;
  };
  unit: {
    unitId: string;
    isCompleted: boolean;
  };
}

interface PageProps {
  params: Promise<{
    unitId: string;
  }>;
}

export default function UnitPage({ params }: PageProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [unitId, setUnitId] = useState<string | null>(null);
  const [unit, setUnit] = useState<UnitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 解析 params
  useEffect(() => {
    params.then(({ unitId }) => {
      setUnitId(unitId);
    });
  }, [params]);

  // 載入單元資料
  useEffect(() => {
    if (!unitId) return;

    const fetchUnit = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/units/${unitId}`);

        if (res.status === 404) {
          setError("找不到此單元");
          return;
        }

        if (!res.ok) {
          setError("載入單元資料失敗");
          return;
        }

        const data: UnitDetail = await res.json();
        setUnit(data);
      } catch (err) {
        console.error("[units/[unitId]/page] 載入單元資料錯誤:", err);
        setError("載入單元資料發生錯誤");
      } finally {
        setLoading(false);
      }
    };

    fetchUnit();
  }, [unitId]);

  /**
   * 完成單元並獲得 XP
   */
  const handleCompleteUnit = async () => {
    if (!unitId || !unit) return;

    try {
      setCompleting(true);

      const res = await fetch(`/api/units/${unitId}`, {
        method: "POST",
      });

      if (res.status === 400) {
        // 單元已完成過
        toast({
          title: "此單元已經完成過了",
          description: "您已經獲得過此單元的 XP 獎勵",
          variant: "default",
        });
        return;
      }

      if (!res.ok) {
        toast({
          title: "完成單元失敗",
          description: "請稍後再試",
          variant: "destructive",
        });
        return;
      }

      const result: CompleteUnitResponse = await res.json();

      // 更新單元完成狀態
      setUnit(prev => prev ? { ...prev, isCompleted: true } : null);

      // 顯示成功訊息
      toast({
        title: "🎉 恭喜完成單元！",
        description: `獲得 ${unit.xpReward} XP！目前等級 ${result.user.level}，總 XP ${result.user.totalXp}`,
        variant: "default",
      });

      // 重新整理使用者資料（讓 header 的 XP 更新）
      router.refresh();
    } catch (err) {
      console.error("[units/[unitId]/page] 完成單元錯誤:", err);
      toast({
        title: "完成單元失敗",
        description: "發生未預期的錯誤",
        variant: "destructive",
      });
    } finally {
      setCompleting(false);
    }
  };

  // Loading 狀態
  if (loading) {
    return (
      <div className="container py-12 max-w-5xl">
        <div className="flex items-center justify-center py-24">
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  // Error 狀態
  if (error || !unit) {
    return (
      <div className="container py-12 max-w-5xl">
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-muted-foreground text-lg">{error || "載入單元資料失敗"}</p>
          <Button variant="outline" asChild>
            <Link href="/courses">返回課程列表</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-5xl">
      {/* 返回按鈕 */}
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/courses/${unit.courseCode}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回課程
        </Link>
      </Button>

      {/* 單元資訊卡片 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{unit.title}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span>課程代碼：{unit.courseCode}</span>
                <span>•</span>
                <span>單元 {unit.orderIndex}</span>
              </CardDescription>
            </div>
            {unit.isCompleted && (
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                已完成
              </Badge>
            )}
          </div>
        </CardHeader>

        {/* 影片播放器 */}
        <CardContent>
          {unit.videoUrl ? (
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
              <video
                data-testid="unit-video"
                className="w-full h-full"
                controls
                src={unit.videoUrl}
              >
                您的瀏覽器不支援影片播放
              </video>
            </div>
          ) : (
            <div className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">尚未提供影片</p>
            </div>
          )}
        </CardContent>

        {/* 完成按鈕 */}
        <CardFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Trophy className="h-4 w-4" />
            <span>完成可獲得 {unit.xpReward} XP</span>
          </div>

          {unit.isCompleted ? (
            <Button variant="outline" disabled>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              已完成
            </Button>
          ) : (
            <Button
              data-testid="complete-unit-button"
              onClick={handleCompleteUnit}
              disabled={completing}
            >
              {completing ? "處理中..." : "標記為完成"}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* 提示資訊 */}
      {!unit.isCompleted && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              💡 提示：觀看完影片後，點擊「標記為完成」按鈕即可獲得 XP 獎勵。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
