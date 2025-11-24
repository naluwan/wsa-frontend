/**
 * RootLayout - 全站根佈局
 * 包含 ThemeProvider、Header、Toaster
 * 各個路由組會自行決定是否需要 Sidebar
 */
import { SiteHeader } from "@/components/site-header";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata = {
  title: "水球軟體學院：軟體設計模式精通之旅 ",
  description: "提升您的工作技能，開啟職涯新篇章",
  icons: {
    icon: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body>
        <Providers>
          <SiteHeader />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
