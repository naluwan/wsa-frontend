/**
 * YoutubePlayer 組件
 * 使用 YouTube IFrame Player API 播放影片
 *
 * 規格說明：
 * - 支援 onProgress 回調（每秒回報播放進度）
 * - 支援 onEnded 回調（影片結束時觸發）
 * - 內部使用 YT.Player API
 * - 自訂控制列（隱藏 YouTube 原生控制項）
 */
"use client"

import { useEffect, useRef, useState, memo } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from "lucide-react"

export interface YoutubePlayerProps {
  videoId: string
  onProgress?: (seconds: number, duration: number) => void
  onEnded?: () => void
  initialPosition?: number  // 初始播放位置（秒）
}

// YouTube IFrame Player API 類型定義
declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

function YoutubePlayerComponent({
  videoId,
  onProgress,
  onEnded,
  initialPosition = 0
}: YoutubePlayerProps) {
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 使用 ref 儲存回調函數，避免觸發 useEffect 重新執行
  const onProgressRef = useRef(onProgress)
  const onEndedRef = useRef(onEnded)

  // 更新回調函數的 ref
  useEffect(() => {
    onProgressRef.current = onProgress
    onEndedRef.current = onEnded
  }, [onProgress, onEnded])

  // 播放器狀態
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // 載入 YouTube IFrame API
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }
  }, [])

  // 初始化 YouTube Player
  useEffect(() => {
    if (!videoId || typeof window === 'undefined') return

    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        playerRef.current = new window.YT.Player('youtube-player', {
          videoId: videoId,
          playerVars: {
            enablejsapi: 1,
            origin: window.location.origin,
            controls: 0,  // 隱藏 YouTube 原生控制項
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
            fs: 0,  // 隱藏全螢幕按鈕
          },
          events: {
            onReady: (event: any) => {
              const videoDuration = event.target.getDuration()
              setDuration(videoDuration)

              // 如果有初始位置，跳到該位置
              if (initialPosition > 0) {
                event.target.seekTo(initialPosition, true)
              }

              // 每秒回報進度
              progressIntervalRef.current = setInterval(() => {
                if (playerRef.current) {
                  const currentTime = playerRef.current.getCurrentTime()
                  const duration = playerRef.current.getDuration()
                  setCurrentTime(currentTime)

                  if (onProgressRef.current) {
                    onProgressRef.current(currentTime, duration)
                  }
                }
              }, 1000)
            },
            onStateChange: (event: any) => {
              // PlayerState: ENDED = 0, PLAYING = 1, PAUSED = 2
              if (event.data === 0 && onEndedRef.current) {
                onEndedRef.current()
                setIsPlaying(false)
              } else if (event.data === 1) {
                setIsPlaying(true)
              } else if (event.data === 2) {
                setIsPlaying(false)
              }
            },
          },
        })
      }
    }

    if (window.YT) {
      initPlayer()
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      if (playerRef.current) {
        playerRef.current.destroy()
      }
    }
  }, [videoId, initialPosition])

  // 監聽全螢幕變化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  /**
   * 播放/暫停
   */
  const handlePlayPause = () => {
    if (!playerRef.current) return

    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      playerRef.current.playVideo()
    }
  }

  /**
   * 調整播放位置
   */
  const handleSeek = (newTime: number) => {
    if (!playerRef.current) return
    playerRef.current.seekTo(newTime, true)
    setCurrentTime(newTime)
  }

  /**
   * 調整音量
   */
  const handleVolumeChange = (newVolume: number) => {
    if (!playerRef.current) return
    playerRef.current.setVolume(newVolume)
    setVolume(newVolume)

    if (newVolume === 0) {
      setIsMuted(true)
      playerRef.current.mute()
    } else if (isMuted) {
      setIsMuted(false)
      playerRef.current.unMute()
    }
  }

  /**
   * 靜音/取消靜音
   */
  const handleVolumeToggle = () => {
    if (!playerRef.current) return

    if (isMuted) {
      playerRef.current.unMute()
      setIsMuted(false)
    } else {
      playerRef.current.mute()
      setIsMuted(true)
    }
  }

  /**
   * 全螢幕切換
   */
  const handleFullscreen = () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      containerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black group"
      data-testid="unit-video"
    >
      {/* YouTube Player 容器 */}
      <div
        id="youtube-player"
        className="absolute inset-0 w-full h-full"
      />

      {/* 覆蓋層：隱藏 YouTube 標題和按鈕 */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />

      {/* 自訂控制列 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        {/* 進度條 */}
        <div className="mb-3">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-yellow-600"
          />
          <div className="flex justify-between text-xs text-white mt-1">
            <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
            <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* 控制按鈕 */}
        <div className="flex items-center gap-4">
          {/* 播放/暫停 */}
          <button
            onClick={handlePlayPause}
            className="text-white hover:text-yellow-600 transition-colors"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </button>

          {/* 音量控制 */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleVolumeToggle}
              className="text-white hover:text-yellow-600 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-yellow-600"
            />
          </div>

          <div className="flex-1" />

          {/* 全螢幕 */}
          <button
            onClick={handleFullscreen}
            className="text-white hover:text-yellow-600 transition-colors"
          >
            {isFullscreen ? (
              <Minimize className="h-5 w-5" />
            ) : (
              <Maximize className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// 使用 React.memo 優化，避免父組件重新渲染時播放器也跟著渲染
// 只有當 videoId 改變時才重新渲染（initialPosition 只在首次載入時使用）
export const YoutubePlayer = memo(YoutubePlayerComponent, (prevProps, nextProps) => {
  return prevProps.videoId === nextProps.videoId
})
