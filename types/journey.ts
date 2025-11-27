/**
 * Journey Domain TypeScript 型別定義
 * 對應後端 Journey API 的 DTO 結構
 */

// ========== 基礎型別 ==========

/** 技能 */
export interface Skill {
  id: number
  name: string
}

/** 獎勵 */
export interface Reward {
  exp: number
  coin: number
  subscriptionExtensionDays: number
  externalRewardDescription?: string | null
}

// ========== Journey 相關型別 ==========

/** 旅程列表項目（GET /api/journeys） */
export interface JourneyListItem {
  id: number
  name: string
  slug: string
  description?: string | null
  teacherName?: string | null
  priceTwd: number
  thumbnailUrl?: string | null
  levelTag?: string | null
  coverIcon?: string | null
  skills: Skill[]
  chapterCount: number
  totalUnits: number
  isOwned?: boolean  // 使用者是否已購買此旅程
}

/** 章節摘要（用於旅程詳情） */
export interface ChapterSummary {
  id: number
  name: string
  orderIndex: number
  passwordRequired: boolean
  reward: Reward
  lessonCount: number
  gymCount: number
}

/** 旅程詳情（GET /api/journeys/:slug） */
export interface JourneyDetail {
  id: number
  name: string
  slug: string
  description?: string | null
  teacherName?: string | null
  priceTwd: number
  originalPriceTwd: number
  monthlyPayment: number
  thumbnailUrl?: string | null
  levelTag?: string | null
  coverIcon?: string | null
  skills: Skill[]
  chapters: ChapterSummary[]
  totalUnits: number
  isOwned?: boolean  // 使用者是否已購買此旅程
}

// ========== Chapter 相關型別 ==========

/** 課程單元摘要 */
export interface LessonSummary {
  id: number
  name: string
  type: 'scroll' | 'video' | 'google-form'
  orderIndex: number
  premiumOnly: boolean
  videoLength?: string | null
  reward: Reward
}

/** 道館摘要 */
export interface GymSummary {
  id: number
  code?: string | null
  name: string
  type?: 'CHALLENGE' | 'BOSS' | null
  difficulty: number
  orderIndex: number
  reward: Reward
  challengeCount: number
}

/** 章節詳情（GET /api/journeys/:slug/chapters） */
export interface ChapterDetail {
  id: number
  name: string
  orderIndex: number
  passwordRequired: boolean
  reward: Reward
  lessons: LessonSummary[]
  gyms: GymSummary[]
}

// ========== Lesson 相關型別 ==========

/** 課程單元詳情（GET /api/journeys/:slug/lessons/:lessonId） */
export interface LessonDetail {
  id: number
  name: string
  description?: string | null
  type: 'scroll' | 'video' | 'google-form'
  premiumOnly: boolean
  videoLength?: string | null
  videoUrl?: string | null
  orderIndex: number
  reward: Reward
  chapterId: number
  chapterName: string
  journeySlug: string
  canAccess: boolean
  isCompleted: boolean
  isOwned?: boolean
  lastPositionSeconds: number
}

// ========== Challenge 相關型別 ==========

/** 挑戰 */
export interface Challenge {
  id: number
  type?: 'PRACTICAL_CHALLENGE' | 'INSTANT_CHALLENGE' | null
  name: string
  recommendDurationDays?: number | null
  maxDurationDays?: number | null
}

// ========== API Response 型別 ==========

/** 旅程列表回應 */
export type JourneyListResponse = JourneyListItem[]

/** 旅程詳情回應 */
export type JourneyDetailResponse = JourneyDetail

/** 章節列表回應 */
export type ChapterListResponse = ChapterDetail[]

/** 課程單元詳情回應 */
export type LessonDetailResponse = LessonDetail
