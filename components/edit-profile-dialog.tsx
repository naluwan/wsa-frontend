'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'

interface EditProfileDialogProps {
  user: {
    id: string
    displayName: string
    nickname?: string | null
    gender?: string | null
    occupation?: string | null
    birthday?: string | null
    location?: string | null
    githubUrl?: string | null
    avatarUrl?: string | null
  }
  onProfileUpdated: () => void
  children?: React.ReactNode
}

export function EditProfileDialog({
  user,
  onProfileUpdated,
  children,
}: EditProfileDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form state
  const [displayName, setDisplayName] = useState(user.displayName || '')
  const [nickname, setNickname] = useState(user.nickname || '')
  const [gender, setGender] = useState(user.gender || '')
  const [occupation, setOccupation] = useState(user.occupation || '')
  const [birthday, setBirthday] = useState<Date | undefined>(
    user.birthday ? new Date(user.birthday) : undefined
  )
  const [location, setLocation] = useState(user.location || '')
  const [githubUrl, setGithubUrl] = useState(user.githubUrl || '')
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '')

  // Year selector state
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<number>(
    birthday ? birthday.getFullYear() : currentYear
  )

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/me/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: displayName || null,
          nickname: nickname || null,
          gender: gender || null,
          occupation: occupation || null,
          birthday: birthday ? format(birthday, 'yyyy-MM-dd') : null,
          location: location || null,
          githubUrl: githubUrl || null,
          avatarUrl: avatarUrl || null,
        }),
      })

      if (!response.ok) {
        throw new Error('更新個人資料失敗')
      }

      toast({
        title: '成功',
        description: '個人資料已更新',
      })

      setOpen(false)
      onProfileUpdated()
    } catch (error) {
      console.error('更新個人資料錯誤:', error)
      toast({
        title: '錯誤',
        description: '更新個人資料失敗，請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Generate year options (1950-2025)
  const years = Array.from({ length: 2025 - 1950 + 1 }, (_, i) => 2025 - i)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>編輯個人資料</DialogTitle>
          <DialogDescription>更新您的個人資料資訊</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Avatar */}
          <div className="grid gap-2">
            <Label htmlFor="avatar">頭像 URL</Label>
            <Input
              id="avatar"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          {/* Display Name */}
          <div className="grid gap-2">
            <Label htmlFor="displayName">姓名</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="請輸入姓名"
            />
          </div>

          {/* Nickname */}
          <div className="grid gap-2">
            <Label htmlFor="nickname">暱稱</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="請輸入暱稱"
            />
          </div>

          {/* Gender */}
          <div className="grid gap-2">
            <Label htmlFor="gender">心理性別</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger>
                <SelectValue placeholder="請選擇性別" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="男">男</SelectItem>
                <SelectItem value="女">女</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Occupation */}
          <div className="grid gap-2">
            <Label htmlFor="occupation">職業</Label>
            <Input
              id="occupation"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="請輸入職業"
            />
          </div>

          {/* Birthday with Year Selector */}
          <div className="grid gap-2">
            <Label>生日</Label>
            <div className="flex gap-2">
              {/* Year Selector */}
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => {
                  const year = parseInt(value)
                  setSelectedYear(year)
                  if (birthday) {
                    const newDate = new Date(birthday)
                    newDate.setFullYear(year)
                    setBirthday(newDate)
                  }
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="年份" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'flex-1 justify-start text-left font-normal',
                      !birthday && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {birthday ? (
                      format(birthday, 'PPP')
                    ) : (
                      <span>選擇日期</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={birthday}
                    onSelect={(date) => {
                      if (date) {
                        date.setFullYear(selectedYear)
                        setBirthday(date)
                      } else {
                        setBirthday(undefined)
                      }
                    }}
                    disabled={(date) =>
                      date > new Date() || date < new Date('1900-01-01')
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Location */}
          <div className="grid gap-2">
            <Label htmlFor="location">所在地區</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue placeholder="請選擇地區" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="台灣">台灣</SelectItem>
                <SelectItem value="中國">中國</SelectItem>
                <SelectItem value="新加波">新加波</SelectItem>
                <SelectItem value="其他地區">其他地區</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* GitHub URL */}
          <div className="grid gap-2">
            <Label htmlFor="githubUrl">GitHub 連結</Label>
            <Input
              id="githubUrl"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? '儲存中...' : '儲存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
