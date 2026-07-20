'use client'

import { useRef, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

const PRESET_COLORS = [
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E', '#EF4444', '#F97316', '#F59E0B',
  '#EAB308', '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#64748B', '#78716C', '#1E293B',
]

interface TagColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function TagColorPicker({ value, onChange }: TagColorPickerProps) {
  const tc = useTranslations('common');
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({ display: 'none' })
  const normalizedValue = value.toLowerCase()

  useEffect(() => {
    if (!open || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    setPopupStyle({
      position: 'fixed',
      left: Math.max(4, rect.right - 178),
      top: rect.bottom + 4,
      zIndex: 50,
      width: 178,
    })
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded border border-[var(--border)] cursor-pointer shrink-0 hover:ring-2 hover:ring-[var(--ring)] transition-shadow"
        style={{ backgroundColor: value }}
        title={tc('clickToSelect')}
      />
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div style={popupStyle} className="p-2 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-5 gap-1">
              {PRESET_COLORS.map((color) => {
                const selected = normalizedValue === color
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => { onChange(color); setOpen(false) }}
                    className={`w-7 h-7 rounded-md transition-all hover:scale-110 active:scale-95 ${
                      selected
                        ? 'ring-2 ring-[var(--ring)] ring-offset-1 ring-offset-[var(--background)]'
                        : color === '#ffffff' ? 'border border-[var(--border)]' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => { inputRef.current?.click() }}
              className="w-full mt-1.5 px-2 py-1 text-xs rounded bg-[var(--background-secondary)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
            >
              {tc('customColor')}...
            </button>
            <input
              ref={inputRef}
              type="color"
              value={value}
              onChange={(e) => { onChange(e.target.value); setOpen(false) }}
              className="absolute opacity-0 w-0 h-0 pointer-events-none"
            />
          </div>
        </>
      )}
    </>
  )
}
