import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * shadcn/ui 工具函數
 * 合併 Tailwind CSS 類名，避免衝突
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
