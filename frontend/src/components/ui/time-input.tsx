'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Input } from './input'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Clock, ChevronUp, ChevronDown } from 'lucide-react'

interface TimeInputProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  required?: boolean
}

export function TimeInput({
  value = '',
  onChange,
  placeholder = 'Pilih waktu',
  disabled = false,
  className,
  id,
  required = false
}: TimeInputProps) {
  const [open, setOpen] = React.useState(false)
  const [hours, setHours] = React.useState('08')
  const [minutes, setMinutes] = React.useState('00')
  const [inputValue, setInputValue] = React.useState('')
  const [isMobile, setIsMobile] = React.useState(false)

  // Detect mobile on mount and resize
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Parse initial value
  React.useEffect(() => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':')
      setHours(h.padStart(2, '0'))
      setMinutes(m.padStart(2, '0'))
      setInputValue(value)
    }
  }, [value])

  const handleTimeChange = (newHours: string, newMinutes: string) => {
    const timeString = `${newHours.padStart(2, '0')}:${newMinutes.padStart(2, '0')}`
    setInputValue(timeString)
    onChange?.(timeString)
    setOpen(false)
  }

  const handleDirectInput = (inputValue: string) => {
    setInputValue(inputValue)
    
    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5]?[0-9])$/
    if (timeRegex.test(inputValue)) {
      const [h, m] = inputValue.split(':')
      const formattedHours = h.padStart(2, '0')
      const formattedMinutes = m.padStart(2, '0')
      const formattedTime = `${formattedHours}:${formattedMinutes}`
      
      setHours(formattedHours)
      setMinutes(formattedMinutes)
      onChange?.(formattedTime)
    }
  }

  const adjustTime = (type: 'hours' | 'minutes', direction: 'up' | 'down') => {
    let newHours = parseInt(hours)
    let newMinutes = parseInt(minutes)

    if (type === 'hours') {
      if (direction === 'up') {
        newHours = newHours >= 23 ? 0 : newHours + 1
      } else {
        newHours = newHours <= 0 ? 23 : newHours - 1
      }
    } else {
      if (direction === 'up') {
        newMinutes = newMinutes >= 59 ? 0 : newMinutes + 1
      } else {
        newMinutes = newMinutes <= 0 ? 59 : newMinutes - 1
      }
    }

    const newHoursStr = newHours.toString().padStart(2, '0')
    const newMinutesStr = newMinutes.toString().padStart(2, '0')
    
    setHours(newHoursStr)
    setMinutes(newMinutesStr)
    
    const timeString = `${newHoursStr}:${newMinutesStr}`
    setInputValue(timeString)
    onChange?.(timeString)
  }

  const quickTimeOptions = [
    { label: '08:00', value: '08:00' },
    { label: '09:00', value: '09:00' },
    { label: '17:00', value: '17:00' },
    { label: '18:00', value: '18:00' },
  ]

  // Mobile version - native time input
  if (isMobile) {
    return (
      <div className="w-full">
        <Input
          id={id}
          type="time"
          value={inputValue}
          onChange={(e) => handleDirectInput(e.target.value)}
          disabled={disabled}
          required={required}
          className={cn(
            "text-center text-lg font-mono h-12 w-full",
            className
          )}
          placeholder={placeholder}
        />
      </div>
    )
  }

  // Desktop version - custom time picker
  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="text"
          value={inputValue}
          onChange={(e) => handleDirectInput(e.target.value)}
          disabled={disabled}
          required={required}
          placeholder="HH:MM"
          className={cn(
            "text-center text-lg font-mono h-12 flex-1",
            className
          )}
          pattern="^([0-1]?[0-9]|2[0-3]):([0-5]?[0-9])$"
        />
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 shrink-0"
              disabled={disabled}
              type="button"
            >
              <Clock className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div className="text-sm font-medium text-center">Pilih Waktu</div>
              
              {/* Quick options */}
              <div className="grid grid-cols-4 gap-2">
                {quickTimeOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      const [h, m] = option.value.split(':')
                      handleTimeChange(h, m)
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-center gap-6">
                  {/* Hours */}
                  <div className="flex flex-col items-center space-y-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => adjustTime('hours', 'up')}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <div className="text-3xl font-mono font-bold w-16 text-center border-2 rounded-lg py-3 bg-muted/50">
                      {hours}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => adjustTime('hours', 'down')}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground font-medium">JAM</span>
                  </div>

                  <div className="text-3xl font-bold text-muted-foreground">:</div>

                  {/* Minutes */}
                  <div className="flex flex-col items-center space-y-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => adjustTime('minutes', 'up')}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <div className="text-3xl font-mono font-bold w-16 text-center border-2 rounded-lg py-3 bg-muted/50">
                      {minutes}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => adjustTime('minutes', 'down')}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground font-medium">MENIT</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleTimeChange(hours, minutes)}
                  className="flex-1"
                >
                  Pilih {hours}:{minutes}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
