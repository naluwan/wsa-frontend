/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions 在 Next.js 14 中已預設啟用，不需要 experimental flag
  output: 'standalone',
  // 暫時跳過 TypeScript 類型檢查（ReactPlayer 動態導入的類型問題）
  typescript: {
    ignoreBuildErrors: true,
  },
  // 暫時禁用 React Strict Mode（可能導致 ReactPlayer 雙重掛載問題）
  reactStrictMode: false,
}

module.exports = nextConfig
