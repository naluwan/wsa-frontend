/**
 * DashboardLayout - Dashboard 頁面佈局
 * 包含側邊欄的頁面使用此佈局
 */
import { DashboardLayout } from '@/components/dashboard-layout';
import { cookies } from 'next/headers';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 檢查使用者是否已登入（檢查 token cookie）
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const isAuthenticated = !!token;

  return <DashboardLayout isAuthenticated={isAuthenticated}>{children}</DashboardLayout>;
}
