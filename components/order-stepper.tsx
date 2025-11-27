/**
 * 訂單流程步驟進度條元件
 * 顯示三個步驟：1. 建立訂單, 2. 完成支付, 3. 約定開學/開始上課！
 * 橫槓會跟隨步驟進度變色
 *
 * Step 3 依課程不同：
 * - 軟體設計模式：約定開學
 * - AI x BDD：開始上課！
 */

import { cn } from "@/lib/utils"

interface OrderStepperProps {
  currentStep: 1 | 2 | 3
  /** 課程 slug，用於決定 Step 3 顯示文字 */
  courseSlug?: string
}

/**
 * 根據課程 slug 取得 Step 3 的文字
 */
function getStep3Label(slug?: string): string {
  if (slug === "software-design-pattern") {
    return "約定開學"
  }
  return "開始上課！"
}

export function OrderStepper({ currentStep, courseSlug }: OrderStepperProps) {
  const steps = [
    { number: 1, label: "建立訂單" },
    { number: 2, label: "完成支付" },
    { number: 3, label: getStep3Label(courseSlug) },
  ]
  return (
    <div
      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-lg p-6"
      data-testid="order-stepper"
    >
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1 last:flex-none">
            {/* 步驟圓圈和標籤 */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors",
                  currentStep >= step.number
                    ? "bg-white text-blue-600"
                    : "bg-transparent border-2 border-blue-300 text-blue-200"
                )}
                data-testid={`step-${step.number}`}
                data-active={currentStep >= step.number}
              >
                {step.number}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium whitespace-nowrap",
                  currentStep >= step.number
                    ? "text-white"
                    : "text-blue-200"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* 連接線（最後一個步驟不顯示） */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-6 transition-colors",
                  // 當下一個步驟已經達成時，這條線變白色
                  currentStep > step.number
                    ? "bg-white"
                    : "bg-blue-400/50"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
