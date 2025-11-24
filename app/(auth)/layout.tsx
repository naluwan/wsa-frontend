/**
 * AuthLayout - 認證頁面專用 Layout
 * 登入/註冊頁面不需要側邊欄，使用簡單的佈局
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pt-16">
      {children}
    </div>
  );
}
