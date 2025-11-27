/**
 * 課程上下文 (Course Context)
 * 管理當前選擇的課程，並在整個應用中共享課程狀態
 *
 * 使用 Journey API 的 slug 作為課程識別
 */
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { JourneyListItem } from "@/types/journey";

// 課程資訊介面（對應 Journey）
export interface Course {
  id: number;           // Journey external ID
  name: string;         // Journey name
  slug: string;         // Journey slug (用於 API 路由)
}

// 課程上下文值的型別
interface CourseContextValue {
  currentCourse: Course | null;
  setCurrentCourse: (course: Course) => void;
  availableCourses: Course[];
  loading: boolean;
}

// 建立課程上下文
const CourseContext = createContext<CourseContextValue | undefined>(undefined);

// 課程提供者組件
export function CourseProvider({ children }: { children: ReactNode }) {
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // 從 API 獲取課程列表
  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/journeys');
        if (res.ok) {
          const data: JourneyListItem[] = await res.json();
          const courses: Course[] = data.map(j => ({
            id: j.id,
            name: j.name,
            slug: j.slug,
          }));
          setAvailableCourses(courses);

          // 預設選擇第一個課程
          if (courses.length > 0 && !currentCourse) {
            setCurrentCourse(courses[0]);
          }
        }
      } catch (error) {
        console.error('獲取課程列表失敗:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  return (
    <CourseContext.Provider value={{
      currentCourse,
      setCurrentCourse,
      availableCourses,
      loading
    }}>
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
