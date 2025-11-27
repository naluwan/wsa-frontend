"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Avatar 組件 - 顯示使用者頭像
 * 使用 Context 讓 AvatarImage 和 AvatarFallback 可以互相溝通
 */
const AvatarContext = React.createContext<{
  imageLoaded: boolean
  setImageLoaded: (loaded: boolean) => void
}>({
  imageLoaded: false,
  setImageLoaded: () => {},
})

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const [imageLoaded, setImageLoaded] = React.useState(false)

  return (
    <AvatarContext.Provider value={{ imageLoaded, setImageLoaded }}>
      <div
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
          className
        )}
        {...props}
      />
    </AvatarContext.Provider>
  )
})
Avatar.displayName = "Avatar"

/**
 * AvatarImage 組件 - 頭像圖片
 * 當圖片載入成功時會隱藏 AvatarFallback
 * 當圖片載入失敗或沒有 src 時會顯示 AvatarFallback
 */
const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, src, onLoad, onError, ...props }, ref) => {
  const { setImageLoaded } = React.useContext(AvatarContext)
  const [hasError, setHasError] = React.useState(false)

  React.useEffect(() => {
    // 當 src 變更時，重置狀態
    setHasError(false)
    setImageLoaded(false)
  }, [src, setImageLoaded])

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageLoaded(true)
    onLoad?.(e)
  }

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true)
    setImageLoaded(false)
    onError?.(e)
  }

  // 如果沒有 src 或載入失敗，不渲染圖片
  if (!src || hasError) {
    return null
  }

  return (
    <img
      ref={ref}
      src={src}
      className={cn("aspect-square h-full w-full object-cover", className)}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  )
})
AvatarImage.displayName = "AvatarImage"

/**
 * AvatarFallback 組件 - 頭像載入失敗時的後備內容
 * 只在圖片未載入成功時顯示
 */
const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { imageLoaded } = React.useContext(AvatarContext)

  // 如果圖片已載入成功，不顯示 fallback
  if (imageLoaded) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted",
        className
      )}
      {...props}
    />
  )
})
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
