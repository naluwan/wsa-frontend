FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app

# 宣告構建時需要的環境變量
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_FACEBOOK_APP_ID
ARG NEXT_PUBLIC_APP_URL

# 將 ARG 轉換為 ENV，讓構建過程可以使用
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_FACEBOOK_APP_ID=$NEXT_PUBLIC_FACEBOOK_APP_ID
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

# 複製 standalone 輸出
COPY --from=builder /app/.next/standalone ./

# 複製靜態檔案
COPY --from=builder /app/.next/static ./.next/static

# 複製 public 目錄（如果存在）
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
