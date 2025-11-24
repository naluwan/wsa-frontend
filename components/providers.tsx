/**
 * Providers 組件
 * 包裝所有需要在 Client Component 中使用的 Provider
 * 這樣可以讓 RootLayout 保持為 Server Component
 */
"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { CourseProvider } from "@/contexts/course-context";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <CourseProvider>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </CourseProvider>
    </ThemeProvider>
  );
}
