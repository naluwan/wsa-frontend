/**
 * 課程上下文 (Course Context)
 * 管理當前選擇的課程，並在整個應用中共享課程狀態
 */
"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// 課程類型定義
export type CourseType = "DESIGN_PATTERNS" | "AI_BDD";

// 課程資訊介面
export interface Course {
  id: CourseType;
  name: string;
  code: string;
}

// 可用的課程列表
export const AVAILABLE_COURSES: Course[] = [
  {
    id: "DESIGN_PATTERNS",
    name: "軟體設計模式精通之旅",
    code: "SOFTWARE_DESIGN_PATTERN",
  },
  {
    id: "AI_BDD",
    name: "AI x BDD：規格驅動全自動開發術",
    code: "AI_X_BDD",
  },
];

// 課程上下文值的型別
interface CourseContextValue {
  currentCourse: Course;
  setCurrentCourse: (course: Course) => void;
}

// 建立課程上下文
const CourseContext = createContext<CourseContextValue | undefined>(undefined);

// 課程提供者組件
export function CourseProvider({ children }: { children: ReactNode }) {
  // 預設選擇第一個課程（軟體設計模式精通之旅）
  const [currentCourse, setCurrentCourse] = useState<Course>(
    AVAILABLE_COURSES[0]
  );

  return (
    <CourseContext.Provider value={{ currentCourse, setCurrentCourse }}>
      {children}
    </CourseContext.Provider>
  );
}

// 使用課程上下文的 Hook
export function useCourse() {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error("useCourse must be used within a CourseProvider");
  }
  return context;
}
