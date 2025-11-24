/**
 * 課程詳情頁面（Course Detail Page）
 * 根據課程代碼顯示課程資訊與單元列表，包含：
 * - 課程標題與描述
 * - 課程難度 badge
 * - 章節化單元列表（使用 Accordion）
 * - 免費試看 badge
 * - 單元鎖定狀態（Lock icon）
 * - 購買課程按鈕（未擁有時）
 *
 * 資料來源：後端 API /api/courses/{courseCode}（真實資料）
 */
import Link from "next/link"
import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import { ArrowLeft, BookOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { PurchaseButton } from "./purchase-button"
import { UnitCard } from "./unit-card"

// 強制此頁面為動態路由，不要快取
export const dynamic = 'force-dynamic';

/**
 * 單元資料型別（對應後端 UnitSummaryDto）
 */
interface UnitSummary {
  id: string;
  unitId: string;
  title: string;
  type: string;
  orderIndex: number;
  isCompleted: boolean;
  sectionTitle: string;       // 章節標題
  orderInSection: number;     // 章節內排序
  isFreePreview: boolean;     // 是否為免費試看
  canAccess: boolean;         // 是否可存取
}

/**
 * 章節資料型別（對應後端 SectionDto）
 */
interface Section {
  sectionTitle: string;
  units: UnitSummary[];
}

/**
 * 課程資料型別（對應後端 CourseDto）
 */
interface Course {
  id: string;
  code: string;
  title: string;
  description: string;
  levelTag: string;
  totalUnits: number;
  coverIcon: string;
  teacherName: string;        // 講師名稱
  priceTwd: number;           // 價格（新台幣）
  thumbnailUrl?: string;      // 縮圖網址
  isOwned?: boolean;          // 是否已擁有此課程
}

/**
 * 課程詳情回應型別（對應後端 CourseDetailResponseDto）
 */
interface CourseDetailResponse {
  course: Course;
  sections: Section[];
}

/**
 * 將 levelTag 轉換為顯示文字
 */
function getLevelText(levelTag: string): string {
  const levelMap: Record<string, string> = {
    beginner: "初級",
    intermediate: "中級",
    advanced: "進階",
  };
  return levelMap[levelTag] || levelTag;
}

/**
 * 取得等級對應的 badge variant
 */
function getLevelVariant(levelTag: string): "default" | "secondary" | "destructive" | "outline" {
  switch (levelTag) {
    case "beginner":
      return "secondary"
    case "intermediate":
      return "default"
    case "advanced":
      return "destructive"
    default:
      return "outline"
  }
}

/**
 * 從後端 API 獲取課程詳情
 * Server Component 直接呼叫後端，不經過前端 API Route
 */
async function getCourseDetail(courseCode: string): Promise<CourseDetailResponse | null> {
  try {
    // Server Component 使用內部 API URL (Docker 容器內部網路)
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    // 從 Server Component 的 cookies 中取得 JWT token
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${apiUrl}/api/courses/${courseCode}`, {
      cache: "no-store", // 不使用快取，確保資料是最新的
      headers,
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      console.error("[courses/[courseCode]/page] 取得課程詳情失敗:", res.status);
      return null;
    }

    const data: CourseDetailResponse = await res.json();
    return data;
  } catch (error) {
    console.error("[courses/[courseCode]/page] 取得課程詳情發生錯誤:", error);
    return null;
  }
}

interface PageProps {
  params: Promise<{
    courseCode: string;
  }>;
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { courseCode } = await params;
  const data = await getCourseDetail(courseCode);

  // 若課程不存在，顯示 404
  if (!data) {
    notFound();
  }

  const { course, sections } = data;
  const levelText = getLevelText(course.levelTag);

  // 檢查使用者是否已登入（從 cookies 取得 token）
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const isLoggedIn = !!token;

  // 計算完成進度（統計所有章節中的單元）
  const allUnits = sections.flatMap(section => section.units);
  const completedUnits = allUnits.filter(u => u.isCompleted).length;
  const progress = course.totalUnits > 0 ? Math.round((completedUnits / course.totalUnits) * 100) : 0;

  return (
    <div className="flex flex-col">
      {/* 返回按鈕與課程標題 */}
      <section className="w-full py-8 md:py-12 bg-gradient-to-b from-muted/50 to-background">
        <div className="container px-4 md:px-6 max-w-5xl">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/courses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回課程列表
            </Link>
          </Button>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant={getLevelVariant(course.levelTag)}>{levelText}</Badge>
              <span className="text-sm text-muted-foreground">
                {completedUnits} / {course.totalUnits} 單元已完成（{progress}%）
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              {course.title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-[700px]">
              {course.description}
            </p>

            {/* 講師名稱 */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-sm">講師：{course.teacherName}</span>
            </div>

            {/* 價格與購買按鈕 / 已擁有狀態 */}
            <div className="flex items-center gap-4 pt-2">
              {course.priceTwd > 0 && (
                <span className="text-2xl font-bold text-primary">
                  NT$ {course.priceTwd.toLocaleString()}
                </span>
              )}

              {course.isOwned ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-4 py-2 text-sm">
                  已擁有課程
                </Badge>
              ) : (
                course.priceTwd > 0 && (
                  <PurchaseButton courseCode={course.code} courseTitle={course.title} />
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 章節與單元列表（使用 Accordion） */}
      <section className="w-full py-8 md:py-12">
        <div className="container px-4 md:px-6 max-w-5xl">
          <h2 className="text-2xl font-bold mb-6">課程內容</h2>

          {sections.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/30">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">此課程尚未建立章節</p>
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={sections.map((_, idx) => `section-${idx}`)} className="space-y-4">
              {sections.map((section, sectionIndex) => (
                <AccordionItem
                  key={`section-${sectionIndex}`}
                  value={`section-${sectionIndex}`}
                  className="border rounded-lg px-6"
                >
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    {section.sectionTitle}
                    <span className="ml-2 text-sm text-muted-foreground font-normal">
                      ({section.units.length} 單元)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-4">
                      {section.units.map((unit) => (
                        <UnitCard
                          key={unit.id}
                          unit={unit}
                          isLoggedIn={isLoggedIn}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </section>
    </div>
  )
}
