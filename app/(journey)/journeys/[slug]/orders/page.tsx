/**
 * 訂單頁面（Journey 版本）
 * Step1: 建立訂單 - 顯示課程資訊並建立訂單
 * Step2: 付款 - 選擇付款方式並完成付款
 *
 * URL:
 * - Step1: /journeys/{slug}/orders?productId={journeyExternalId}
 * - Step2: /journeys/{slug}/orders?productId={journeyExternalId}&orderNumber={orderNo}
 *
 * 參數說明：
 * - slug: Journey 的 slug（例如：software-design-pattern）
 * - productId: Journey 的 externalId，暫時也作為舊訂單 API 的 courseId 使用
 * - orderNumber: 訂單編號（有此參數時進入 Step2）
 */

import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { OrderStepper } from "@/components/order-stepper";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CreateOrderButton } from "./create-order-button";
import { PaymentForm } from "./payment-form";
import type { JourneyDetail, ChapterDetail } from "@/types/journey";

// 強制動態渲染
export const dynamic = "force-dynamic";

/**
 * 章節預計開課時間配置
 * AI x BDD 課程的各章節開課時間
 */
const AI_BDD_CHAPTER_DATES: Record<string, string> = {
  規格驅動開發的前提: "2025/09/29",
  "100% 全自動化開發的脈絡：規格的光譜": "2025/10/27",
  "70% 自動化：測試驅動開發": "2025/11/03",
  "80% 自動化：行為驅動開發 (BDD)": "2025/11/17",
  "90% 自動化：指令集架構之可執行規格": "2025/12/08",
  "99% 自動化：為企業打造專屬 BDD Master Agent": "2025/12/15",
  "100% 自動化：超 AI 化": "2026/02/01",
  "全自動化開發 in 軟體/DevOps": "2026/02/01",
};

/**
 * 從後端取得 Journey 詳情
 */
async function getJourneyDetail(slug: string): Promise<JourneyDetail | null> {
  try {
    const apiUrl =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8080";
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${apiUrl}/api/journeys/${slug}`, {
      cache: "no-store",
      headers,
    });

    if (!res.ok) {
      console.error(`[orders/page] 取得 Journey 詳情失敗: ${res.status}`);
      return null;
    }

    const journey: JourneyDetail = await res.json();
    return journey;
  } catch (error) {
    console.error("[orders/page] 取得 Journey 詳情失敗:", error);
    return null;
  }
}

/**
 * 從後端取得 Journey 章節列表（包含 lessons 和 gyms）
 */
async function getJourneyChapters(slug: string): Promise<ChapterDetail[]> {
  try {
    const apiUrl =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8080";
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${apiUrl}/api/journeys/${slug}/chapters`, {
      cache: "no-store",
      headers,
    });

    if (!res.ok) {
      console.error(`[orders/page] 取得章節列表失敗: ${res.status}`);
      return [];
    }

    const chapters: ChapterDetail[] = await res.json();
    return chapters;
  } catch (error) {
    console.error("[orders/page] 取得章節列表失敗:", error);
    return [];
  }
}

/**
 * 訂單資料介面
 */
interface Order {
  id: string;
  orderNo: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string | null;
  amount: number;
  status: string;
  payDeadline: string;
  paidAt: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
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
      console.error(`[orders/page] 取得訂單失敗: ${res.status}`);
      return null;
    }

    const order: Order = await res.json();
    return order;
  } catch (error) {
    console.error("[orders/page] 取得訂單失敗:", error);
    return null;
  }
}

/**
 * 從後端取得使用者所有訂單
 */
async function getUserOrders(): Promise<Order[]> {
  try {
    const apiUrl =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8080";
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return [];
    }

    const res = await fetch(`${apiUrl}/api/users/me/orders`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.error(`[orders/page] 取得使用者訂單失敗: ${res.status}`);
      return [];
    }

    const orders: Order[] = await res.json();
    return orders;
  } catch (error) {
    console.error("[orders/page] 取得使用者訂單失敗:", error);
    return [];
  }
}

/**
 * 從後端取得最後觀看位置
 */
async function getLastWatched(slug: string): Promise<{ chapterId: number; lessonId: number } | null> {
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

    const res = await fetch(`${apiUrl}/api/journeys/${slug}/last-watched`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok || res.status === 204) {
      return null;
    }

    const data = await res.json();
    if (data && data.chapterId && data.lessonId) {
      return { chapterId: data.chapterId, lessonId: data.lessonId };
    }
    return null;
  } catch (error) {
    console.error("[orders/page] 取得最後觀看位置失敗:", error);
    return null;
  }
}

/**
 * 取得課程的第一個單元（用於已擁有課程但無觀看記錄時的預設跳轉）
 */
function getFirstLesson(slug: string): { chapterId: number; lessonId: number } {
  switch (slug) {
    case "software-design-pattern":
      return { chapterId: 8, lessonId: 8001 };
    case "ai-bdd":
    case "ai-x-bdd":
      return { chapterId: 4000, lessonId: 40001 };
    default:
      return { chapterId: 0, lessonId: 0 };
  }
}

/**
 * 格式化日期時間（轉換為台北時間）
 */
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  // 使用 toLocaleString 轉換為台北時間
  const taipeiDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
  const year = taipeiDate.getFullYear();
  const month = String(taipeiDate.getMonth() + 1).padStart(2, "0");
  const day = String(taipeiDate.getDate()).padStart(2, "0");
  const hours = taipeiDate.getHours();
  const minutes = String(taipeiDate.getMinutes()).padStart(2, "0");

  // 判斷 AM/PM
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12; // 轉換為 12 小時制

  return `${year}年${month}月${day}日 ${String(displayHours).padStart(2, "0")}:${minutes} ${period}`;
}

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ productId?: string; orderNumber?: string }>;
}

export default async function OrderPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { productId, orderNumber } = await searchParams;

  // 檢查是否有 productId（暫時作為 courseId 使用）
  if (!productId) {
    redirect("/journeys");
  }

  // 判斷當前步驟：有 orderNumber 時為 Step2，否則為 Step1
  const currentStep: 1 | 2 = orderNumber ? 2 : 1;

  // 如果是 Step2，取得訂單資料
  let order: Order | null = null;
  if (orderNumber) {
    order = await getOrder(orderNumber);
    if (!order) {
      // 訂單不存在，導回 Step1
      redirect(`/journeys/${slug}/orders?productId=${productId}`);
    }
    // 如果訂單已付款，導向完成頁面
    if (order.status === "paid") {
      redirect(`/orders/${orderNumber}/complete`);
    }
    // 如果訂單已取消，導回課程列表
    if (order.status === "cancelled") {
      redirect("/journeys");
    }
  }

  // 取得 Journey 詳情
  const journey = await getJourneyDetail(slug);
  if (!journey) {
    notFound();
  }

  // ===== 進入頁面時的智慧重定向邏輯 =====
  // 只有在 Step1（沒有 orderNumber）時才執行檢查
  if (!orderNumber) {
    // 1. 如果已擁有課程 → 重定向到最後觀看位置（或第一個單元）
    if (journey.isOwned) {
      console.log("[orders/page] 使用者已擁有課程，準備重定向...");
      const lastWatched = await getLastWatched(slug);
      const firstLesson = getFirstLesson(slug);

      if (lastWatched) {
        console.log("[orders/page] 重定向到最後觀看位置:", lastWatched);
        redirect(`/journeys/${slug}/chapters/${lastWatched.chapterId}/missions/${lastWatched.lessonId}`);
      } else {
        console.log("[orders/page] 無觀看記錄，重定向到第一個單元:", firstLesson);
        redirect(`/journeys/${slug}/chapters/${firstLesson.chapterId}/missions/${firstLesson.lessonId}`);
      }
    }

    // 2. 如果有待付款訂單 → 重定向到該訂單的付款頁面
    const userOrders = await getUserOrders();
    const pendingOrder = userOrders.find(
      (o) =>
        o.courseSlug === slug &&
        o.status === "pending" &&
        new Date() <= new Date(o.payDeadline)
    );

    if (pendingOrder) {
      console.log("[orders/page] 發現待付款訂單，重定向到付款頁面:", pendingOrder.orderNo);
      redirect(`/journeys/${slug}/orders?productId=${productId}&orderNumber=${pendingOrder.orderNo}`);
    }
  }

  // 取得章節列表
  const chapters = await getJourneyChapters(slug);

  // 計算總章節數和總單元數
  const totalChapters = chapters.length;
  const totalLessons = chapters.reduce(
    (acc, chapter) => acc + chapter.lessons.length,
    0
  );

  // 課程類型判斷（用於特殊顯示）
  const isAIxBDD =
    slug === "ai-bdd" ||
    slug === "ai-x-bdd" ||
    journey.name.includes("AI x BDD");
  const isSoftwareDesignPattern = slug === "software-design-pattern";

  // 過濾掉「課程介紹 & 試聽」章節
  // 軟體設計模式額外過濾掉「副本六」和「副本七」（尚未完整開放）
  const filteredChapters = chapters.filter((chapter) => {
    // 排除課程介紹 & 試聽
    if (chapter.name.includes("課程介紹") || chapter.name.includes("試聽")) {
      return false;
    }
    // 軟體設計模式：排除副本六和副本七
    if (isSoftwareDesignPattern) {
      if (chapter.name.includes("副本六") || chapter.name.includes("副本七")) {
        return false;
      }
    }
    return true;
  });

  // 使用過濾後的章節計算
  const displayChapters = filteredChapters;
  const totalFilteredLessons = filteredChapters.reduce(
    (acc, chapter) => acc + chapter.lessons.length,
    0
  );

  // 金額配置（從資料庫讀取）
  const priceConfig = {
    currentPrice: journey.priceTwd,
    originalPrice: journey.originalPriceTwd,
    monthlyPayment: journey.monthlyPayment,
  };

  // 章節數字轉中文
  const chapterNumberToChinese = (index: number): string => {
    const chineseNumbers = [
      "零",
      "一",
      "二",
      "三",
      "四",
      "五",
      "六",
      "七",
      "八",
      "九",
      "十",
    ];
    if (index < 10) return chineseNumbers[index];
    if (index === 10) return "十";
    if (index < 20) return `十${chineseNumbers[index - 10]}`;
    return index.toString();
  };

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
            <OrderStepper currentStep={currentStep} courseSlug={slug} />

            {/* ===== Step 1: 課程確認內容 ===== */}
            {currentStep === 1 && (
              <>
                {/* 課程內容區塊 - 藍紫漸層背景 */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 sm:p-8">
                  {/* 課程標題 */}
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                    {isAIxBDD
                      ? "AI x BDD：規格驅動全自動開發術"
                      : isSoftwareDesignPattern
                      ? "軟體設計模式精通之旅 (半年特訓)"
                      : journey.name}
                  </h1>

                  {/* 課程描述 */}
                  <div className="text-blue-100 leading-relaxed space-y-6">
                    {isAIxBDD ? (
                      <>
                        <p>
                          這門課程要帶你「用半年的時間，徹底學會如何結合 TDD、BDD 與
                          AI，實現 100%
                          全自動化、高精準度的程式開發」。上完課後，你不只是理解方法，更能真正把
                          AI 落實到專案裡，從此不再困在無止盡的 Debug 與
                          Review，而是成為團隊裡能制定規格與標準的工程師。
                        </p>
                        <p>
                          在這趟學習過程中，你將透過影音課程、專屬社群、每週研討會與實戰演練，逐步掌握如何用規格驅動開發，讓
                          AI 自動完成從測試到程式修正的一整套流程。本課程將自 9/22
                          起每週陸續上架新單元，確保你能循序學習、穩定進步。現在購買僅需
                          NT$7,799（原價
                          NT$15,999），未來隨著開課內容愈完整，價格也會逐步上漲。
                        </p>
                        <p>
                          只要你願意跟著每週內容踏實學習，我能保證在半年內，你將能真正掌握
                          AI x BDD
                          的核心思維與實作方法，做到規格驅動、全自動化、高精準度的開發。這是大多數工程師甚至許多架構師都未曾系統性鍛鍊過的能力，而你將是那少數能用
                          AI 驅動專案的人。
                        </p>
                      </>
                    ) : isSoftwareDesignPattern ? (
                      <>
                        <p>
                          這門課旨在讓你「用一趟旅程的時間，成為硬核的 Coding
                          高手」，在軟體設計方面「徹底變強、並享受變強後的職涯好處」，上完課後便能游刃有餘地把系統做大做精。
                        </p>
                        <p>
                          在這趟旅程中，你將從小的題目開始練起 OOAD
                          和設計模式，由淺入深不斷地套用設計模式、到了副本四之後就會鼓勵你將所學落地到規模大一些的框架、如：Logging
                          Framework、loC Framework 以及 WebFramework。
                        </p>
                        <p>
                          只要你努力學習，我保證你能在半年內學會如何分析、精準套用設計模式和開發出大型系統（如：WebFramework
                          /
                          Engine），開發完之後還能留下模式語言，來佐證你的設計既合理又充分。這是八成的工程師都做不到的事，甚至許多架構師也未有機會能鍛鍊到類似的能力。
                        </p>
                      </>
                    ) : (
                      <p className="whitespace-pre-line">
                        {journey.description || ""}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ===== Step 2: 付款內容 ===== */}
            {currentStep === 2 && order && (
              <div className="p-6 sm:p-8">
                {/* 訂單資訊 */}
                <div className="mb-6 p-4 border border-slate-600 rounded-lg bg-slate-700/50 space-y-2">
                  {/* 訂單編號 - 同一排左右對齊 */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">訂單編號:</span>
                    <span className="font-mono font-semibold text-white">
                      {order.orderNo}
                    </span>
                  </div>
                  {/* 付款截止時間 - 同一排左右對齊 */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">付款截止時間:</span>
                    <span className="font-semibold text-white">
                      {formatDateTime(order.payDeadline)}
                    </span>
                  </div>
                </div>

                {/* 付款表單 */}
                <PaymentForm
                  orderNo={order.orderNo}
                  amount={order.amount}
                  slug={slug}
                />
              </div>
            )}

            {/* ===== Step 1 內容（續）===== */}
            {currentStep === 1 && (
              <>
                {/* 提示訊息 - 黃色背景 Alert */}
                <div className="px-6 sm:px-8 py-4">
                  <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                    <AlertDescription className="text-yellow-800 dark:text-yellow-200 text-sm">
                      {isAIxBDD ? (
                        <>
                          若你曾購買過《軟體設計模式精通之旅》或者《AI x BDD
                          行為驅動開發工作坊》，請私訊{" "}
                          <Link
                            href="https://line.me/R/ti/p/@180cljxx?oat__id=5828037"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium"
                          >
                            LINE 客服
                          </Link>
                          ，索取課程折價券。
                        </>
                      ) : (
                        "課程購買後不會馬上開始，你可以依照自己的狀況，選擇最適合的時間開始學習。無論是下個月，甚至是三個月後，完全不影響你的學習安排。"
                      )}
                    </AlertDescription>
                  </Alert>
                </div>

            {/* ⓵ 教材保證 */}
            <div className="px-6 sm:px-8 py-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500 text-slate-900 text-sm font-bold">
                    1
                  </span>
                  教材保證：
                  {isSoftwareDesignPattern
                    ? "40 多部精緻教學影片 x 大量實戰題目"
                    : "八大章節 x 78 個單元 x 5 道實戰題目"}
                </h2>
                {isAIxBDD && (
                  <Link
                    href="https://docs.google.com/spreadsheets/d/1hJPwdVEvrNPx4BXp7kQR05GHvCW1O3nwp7t-0kgwFFs/edit?gid=1986447731#gid=1986447731"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm underline"
                  >
                    詳細開課時程承諾
                  </Link>
                )}
              </div>

              <div className="space-y-2">
                {displayChapters.map((chapter, index) => {
                  // 取得章節預計開課時間（僅 AI x BDD 課程顯示）
                  const chapterDate = isAIxBDD
                    ? AI_BDD_CHAPTER_DATES[chapter.name]
                    : null;

                  return (
                    <div
                      key={`chapter-${chapter.id}`}
                      className="border border-slate-600 rounded-lg bg-slate-700 overflow-hidden"
                    >
                      <Accordion type="single" collapsible defaultValue="">
                        <AccordionItem
                          value={`chapter-${chapter.id}`}
                          className="border-0"
                        >
                          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-600 text-white [&>svg]:text-slate-400">
                            <div className="flex flex-col items-start gap-1 text-left flex-1">
                              <span className="text-sm font-normal">
                                {chapter.name}
                              </span>
                              {chapterDate && (
                                <span className="text-xs text-slate-400 font-normal">
                                  本章節預計開課時間 {chapterDate}
                                </span>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4 bg-slate-700">
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                              {chapter.lessons.map((lesson) => (
                                <li key={lesson.id}>{lesson.name}</li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ⓶ 服務保證 */}
            <div className="px-6 sm:px-8 py-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500 text-slate-900 text-sm font-bold">
                  2
                </span>
                {isSoftwareDesignPattern
                  ? "服務保證：保證我會手把手透過私訊來幫你解惑"
                  : "你將獲得一個充滿行動力的線上學習環境"}
              </h2>

              <div className="space-y-2">
                {/* 軟體設計模式：4個項目 / AI x BDD：2個項目 */}
                {isSoftwareDesignPattern ? (
                  <>
                    {/* 軟體設計模式的服務保證 */}
                    <div className="border border-slate-600 rounded-lg bg-slate-700 overflow-hidden">
                      <Accordion type="single" collapsible defaultValue="">
                        <AccordionItem value="service-1" className="border-0">
                          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-600 text-white [&>svg]:text-slate-400">
                            <span className="text-left flex-1 text-sm font-normal">
                              你將獲得一個充滿行動力的線上學習環境
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4 text-sm text-slate-300 bg-slate-700">
                            專屬社群、每週研討會與實戰演練，讓你與其他學員一起成長。
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>

                    <div className="border border-slate-600 rounded-lg bg-slate-700 overflow-hidden">
                      <Accordion type="single" collapsible defaultValue="">
                        <AccordionItem value="service-2" className="border-0">
                          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-600 text-white [&>svg]:text-slate-400">
                            <span className="text-left flex-1 text-sm font-normal">
                              保證我會手把手透過私訊來幫你解惑
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4 text-sm text-slate-300 bg-slate-700">
                            有任何問題都可以私訊我，我會親自回覆你的問題。
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>

                    <div className="border border-slate-600 rounded-lg bg-slate-700 overflow-hidden">
                      <Accordion type="single" collapsible defaultValue="">
                        <AccordionItem value="service-3" className="border-0">
                          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-600 text-white [&>svg]:text-slate-400">
                            <span className="text-left flex-1 text-sm font-normal">
                              每一題都幫你 Review 回饋
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4 text-sm text-slate-300 bg-slate-700">
                            提交作業後，會收到詳細的程式碼 Review 與改進建議。
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>

                    <div className="border border-slate-600 rounded-lg bg-slate-700 overflow-hidden">
                      <Accordion type="single" collapsible defaultValue="">
                        <AccordionItem value="service-4" className="border-0">
                          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-600 text-white [&>svg]:text-slate-400">
                            <span className="text-left flex-1 text-sm font-normal">
                              專屬於你的技能評級成長系統
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4 text-sm text-slate-300 bg-slate-700">
                            追蹤你的學習進度與技能成長，讓你清楚看見自己的進步。
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  </>
                ) : (
                  <>
                    {/* AI x BDD 的服務保證 */}
                    <div className="border border-slate-600 rounded-lg bg-slate-700 overflow-hidden">
                      <Accordion type="single" collapsible defaultValue="">
                        <AccordionItem value="service-1" className="border-0">
                          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-600 text-white [&>svg]:text-slate-400">
                            <span className="text-left flex-1 text-sm font-normal">
                              充滿行動力的線上學習環境
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4 text-sm text-slate-300 bg-slate-700">
                            專屬社群、每週研討會與實戰演練，讓你與其他學員一起成長。
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>

                    <div className="border border-slate-600 rounded-lg bg-slate-700 overflow-hidden">
                      <Accordion type="single" collapsible defaultValue="">
                        <AccordionItem value="service-2" className="border-0">
                          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-600 text-white [&>svg]:text-slate-400">
                            <span className="text-left flex-1 text-sm font-normal">
                              專屬於你的技能評級成長系統
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4 text-sm text-slate-300 bg-slate-700">
                            追蹤你的學習進度與技能成長，讓你清楚看見自己的進步。
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  </>
                )}
              </div>
            </div>

                {/* 價格與購買按鈕 */}
                <div className="px-6 sm:px-8 py-6 border-t border-slate-700">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-xl font-bold text-white">售價</span>
                    <div className="flex flex-col items-end">
                      <div className="flex items-baseline gap-3">
                        {priceConfig.originalPrice > priceConfig.currentPrice && (
                          <span className="text-slate-400 line-through text-lg">
                            NT${priceConfig.originalPrice.toLocaleString()}
                          </span>
                        )}
                        <span className="text-3xl font-bold text-green-400">
                          NT${priceConfig.currentPrice.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        使用銀角零卡分期付款，最低每期只需付{" "}
                        {priceConfig.monthlyPayment} 元
                      </p>
                    </div>
                  </div>

                  {/* 使用 productId 作為 courseId 傳給舊的訂單 API */}
                  <CreateOrderButton courseId={productId} slug={slug} />
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
