/**
 * Step3: 完成頁面（Journey 版本）
 * 顯示訂單完成訊息
 * URL: /journeys/{slug}/orders/complete?orderNumber={orderNo}
 */

import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { OrderStepper } from "@/components/order-stepper";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

// 強制動態渲染
export const dynamic = "force-dynamic";

interface Order {
  id: string;
  orderNo: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  status: string;
  payDeadline: string;
  paidAt: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FirstLesson {
  chapterId: number;
  lessonId: number;
}

/**
 * 從後端取得訂單資料
 */
async function getOrder(orderNo: string): Promise<Order | null> {
  try {
    const apiUrl =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8080";
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    const res = await fetch(`${apiUrl}/api/orders/${orderNo}`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return null;
    }

    const order: Order = await res.json();
    return order;
  } catch (error) {
    console.error("[orders/complete] 取得訂單失敗:", error);
    return null;
  }
}

/**
 * 取得「課程介紹」章節的第一個 Lesson
 */
async function getFirstLesson(slug: string): Promise<FirstLesson | null> {
  try {
    const apiUrl =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8080";
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // 呼叫章節 API 取得所有章節與課程
    const res = await fetch(`${apiUrl}/api/journeys/${slug}/chapters`, {
      cache: "no-store",
      headers,
    });

    if (!res.ok) {
      return null;
    }

    const chapters = await res.json();

    // 找出「課程介紹」章節
    const introChapter = chapters.find((chapter: any) =>
      chapter.name.includes("課程介紹")
    );

    // 取得「課程介紹」章節的第一個 lesson
    if (introChapter && introChapter.lessons && introChapter.lessons.length > 0) {
      const firstLesson = introChapter.lessons[0];
      return {
        chapterId: introChapter.id,
        lessonId: firstLesson.id,
      };
    }

    return null;
  } catch (error) {
    console.error("[orders/complete] 取得第一個 Lesson 失敗:", error);
    return null;
  }
}

/**
 * 格式化日期時間
 */
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ orderNumber?: string }>;
}

export default async function CompletePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { orderNumber } = await searchParams;

  // 檢查登入狀態
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    redirect(`/login?redirect=/journeys/${slug}/orders/complete?orderNumber=${orderNumber}`);
  }

  // 檢查是否有 orderNumber
  if (!orderNumber) {
    redirect(`/journeys/${slug}`);
  }

  // 取得訂單資料
  const order = await getOrder(orderNumber);
  if (!order) {
    notFound();
  }

  // 如果訂單尚未付款，導向付款頁面
  if (order.status === "pending") {
    redirect(`/journeys/${slug}/orders?productId=${order.courseId}&orderNumber=${orderNumber}`);
  }

  // 如果訂單已取消，導向課程列表
  if (order.status === "cancelled") {
    redirect("/courses");
  }

  // 取得第一個 Lesson 的 URL
  const firstLesson = await getFirstLesson(slug);
  const startLearningUrl = firstLesson
    ? `/journeys/${slug}/chapters/${firstLesson.chapterId}/missions/${firstLesson.lessonId}`
    : `/journeys/${slug}`; // 如果取不到第一個 lesson，就導向 Journey 詳情頁

  return (
    <div className="min-h-screen bg-slate-900">
      {/* 左上角 Logo（可點擊返回首頁） */}
      <Link
        href="/"
        className="fixed top-4 left-4 z-50 flex items-center gap-3"
      >
        <Image
          src="/images/logo.png"
          alt="水球軟體學院"
          width={40}
          height={40}
          className="rounded-lg"
        />
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white">水球軟體學院</span>
          <span className="text-xs text-slate-400">WATERBALLSA.TW</span>
        </div>
      </Link>

      {/* 主內容區 */}
      <main className="pt-20 pb-8 px-4">
        <div className="w-full max-w-4xl mx-auto">
          {/* 整體卡片容器 */}
          <div className="bg-slate-800 rounded-lg overflow-hidden">
            {/* 步驟進度條 */}
            <OrderStepper currentStep={3} courseSlug={slug} />

            {/* 成功訊息 */}
            <div className="p-6 sm:p-8">
              <div className="text-center mb-8">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-white mb-4">付款成功！</h1>
                <p className="text-lg text-slate-300">恭喜你成功購買課程！</p>
              </div>

              {/* 訂單資訊 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 p-6 border border-slate-600 rounded-lg bg-slate-700/50">
                <div>
                  <div className="text-sm text-slate-400 mb-1">訂單編號</div>
                  <div className="font-mono font-semibold text-white">
                    {order.orderNo}
                  </div>
                </div>
                <div className="md:text-right">
                  <div className="text-sm text-slate-400 mb-1">付款時間</div>
                  <div className="font-semibold text-white">
                    {order.paidAt ? formatDateTime(order.paidAt) : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">課程名稱</div>
                  <div className="font-semibold text-white">{order.courseTitle}</div>
                </div>
                <div className="md:text-right">
                  <div className="text-sm text-slate-400 mb-1">付款金額</div>
                  <div className="font-semibold text-blue-400">
                    NT$ {order.amount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* 後續說明 */}
              <div className="p-6 mb-6 rounded-lg bg-blue-900/30 border border-blue-500">
                <h2 className="text-lg font-bold text-white mb-3">
                  接下來該做什麼？
                </h2>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>我們會在 24 小時內寄送課程開通通知到你的信箱</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>你現在可以開始瀏覽課程內容了</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>如有任何問題，歡迎聯絡客服 sales@waterballsa.tw</span>
                  </li>
                </ul>
              </div>

              {/* 操作按鈕 */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Link href="/courses">回到課程列表</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="flex-1 border-slate-600 text-white hover:bg-slate-700"
                >
                  <Link href={startLearningUrl}>開始學習</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
