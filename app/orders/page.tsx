// ==============================================================================
// DEPRECATED:
// 本頁面屬於舊的 Course 訂單流程，已被 Journey 訂單流程取代。
// 目前暫時保留以利比對與回滾，請勿在新開發時使用此頁面。
//
// 新的訂單流程：
// - 頁面路徑：/journeys/[slug]/orders?productId={journeyExternalId}
// - Step 1：建立訂單（填寫個人資訊）
// - Step 2：完成支付（顯示訂單編號、付款資訊）
//
// 此頁面將在確認無任何使用後移除。
// ==============================================================================

/**
 * @deprecated 舊的訂單頁面，已被 /journeys/[slug]/orders 取代
 *
 * Step1: 建立訂單頁面（已棄用）
 * 顯示課程資訊並建立訂單
 * URL: /orders?courseId={courseId}
 */

'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InfoIcon } from 'lucide-react'

// 強制動態渲染
export const dynamic = 'force-dynamic'

export default function DeprecatedOrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams?.get('courseId')

  useEffect(() => {
    // 自動導向新的課程列表頁面
    // 若有 courseId 參數，可以嘗試查詢對應的 Journey slug 並導向
    // 目前先統一導向課程列表頁
    const timer = setTimeout(() => {
      router.replace('/journeys')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Alert className="border-yellow-500 bg-yellow-50">
          <InfoIcon className="h-5 w-5 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="space-y-4">
              <p className="text-lg font-semibold">
                此訂單頁面已下線
              </p>
              <p>
                請從課程頁面重新點擊「立刻購買」按鈕，進入新的訂單流程。
              </p>
              <p className="text-sm">
                {courseId ? (
                  <>正在為您導向課程列表頁面...</>
                ) : (
                  <>3 秒後將自動導向課程列表頁面...</>
                )}
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.replace('/journeys')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            立即前往課程列表
          </button>
        </div>
      </div>
    </div>
  )
}
