'use client'
import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import localeData from 'dayjs/plugin/localeData'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

dayjs.extend(localeData)

// Build a local day without JS Date constructor
const buildLocalDay = (y, m, d) =>
  dayjs().year(y).month(m).date(d).startOf('day')

// Export as a JS Date that will NOT roll back a day when converted to UTC
const toSafeJsDate = (djs) => djs.hour(12).minute(0).second(0).millisecond(0).toDate()

export default function DatePicker({
  label = 'Select Admission Date',
  value,
  onChange,
  selectionMode = 'single' // 'single' | 'range'
}) {
  const today = dayjs()

  const [mode, setMode] = useState('date') // date | month | year
  const [currentDate, setCurrentDate] = useState(dayjs())
  const [selectedDate, setSelectedDate] = useState(dayjs())

  const [rangeStart, setRangeStart] = useState(null)
  const [rangeEnd, setRangeEnd] = useState(null)

  const [yearRangeStart, setYearRangeStart] = useState(dayjs().year() - 2)

  const monthNames = dayjs.months()
  const startDay = currentDate.startOf('month').day()
  const daysInMonth = currentDate.daysInMonth()
  const month = currentDate.month()
  const year = currentDate.year()

  // ---------------------------
  // DATE SELECTION
  // ---------------------------
  const handleSelectDate = (day) => {
    const newDate = buildLocalDay(year, month, day)

    if (selectionMode === 'single') {
      setSelectedDate(newDate)
      onChange?.(toSafeJsDate(newDate))
      return
    }

    // RANGE MODE
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(newDate)
      setRangeEnd(null)
      return
    }

    if (!rangeEnd) {
      const start = newDate.isBefore(rangeStart) ? newDate : rangeStart
      const end = newDate.isBefore(rangeStart) ? rangeStart : newDate

      setRangeStart(start)
      setRangeEnd(end)

      onChange?.({
        start: toSafeJsDate(start),
        end: toSafeJsDate(end)
      })
    }
  }

  // ---------------------------
  // MONTH / YEAR SELECTION
  // ---------------------------
  const handleMonthSelect = (m) => {
    setCurrentDate(currentDate.month(m))
    setMode('date')
  }

  const handleYearSelect = (y) => {
    setCurrentDate(currentDate.year(y))
    setMode('month')
  }

  // ---------------------------
  // NAVIGATION
  // ---------------------------
  const prevMonth = () => setCurrentDate(currentDate.subtract(1, 'month'))
  const nextMonth = () => setCurrentDate(currentDate.add(1, 'month'))

  const prevYearSet = () => setYearRangeStart(yearRangeStart - 20)
  const nextYearSet = () => setYearRangeStart(yearRangeStart + 20)

  const years = Array.from({ length: 20 }, (_, i) => yearRangeStart + i)

  // ---------------------------
  // DAY GRID
  // ---------------------------
  const renderDays = () => {
    const days = []

    for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`} />)

    for (let d = 1; d <= daysInMonth; d++) {
      // IMPORTANT: no JS Date() here
      const date = buildLocalDay(year, month, d)

      const isSingleSelected =
        selectionMode === 'single' &&
        selectedDate?.isSame(date, 'day')

      const isRangeStart = rangeStart && date.isSame(rangeStart, 'day')
      const isRangeEnd = rangeEnd && date.isSame(rangeEnd, 'day')
      const isInRange =
        rangeStart &&
        rangeEnd &&
        date.isAfter(rangeStart, 'day') &&
        date.isBefore(rangeEnd, 'day')

      days.push(
        <div
          key={d}
          onClick={() => handleSelectDate(d)}
          className={`
            w-10 h-10 flex items-center justify-center cursor-pointer transition-all
            ${isInRange ? 'bg-[var(--color-primary)] text-white' : ''}
            ${(isSingleSelected)
              ? 'bg-[var(--color-primary)] text-white font-semibold rounded-full'
              : (isRangeStart)
                ? 'bg-[var(--color-primary)] text-white font-semibold rounded-l-full'
                : (isRangeEnd)
                  ? 'bg-[var(--color-primary)] text-white font-semibold rounded-r-full'
              : 'hover:bg-[var(--color-primary-hover)] hover:text-white'}
            ${today.isSame(date, 'day') && !isInRange ? 'border border-gray-500' : ''}
          `}
        >
          {d}
        </div>
      )
    }

    return days
  }

  // ---------------------------
  // EXTERNAL VALUE SYNC
  // ---------------------------
  useEffect(() => {
    if (!value) return

    if (selectionMode === 'single') {
      const valDate = dayjs(value)
      setSelectedDate(valDate)
      setCurrentDate(valDate)
    } else {
      let newValue = value
      // If value is a string (from InputField), parse it
      if (typeof value === 'string' && value.includes('to')) {
        const parts = value.split('to').map(part => part.trim())
        newValue = {
          start: parts[0],
          end: parts[1]
        }
      }
      if (newValue.start) setRangeStart(dayjs(newValue.start))
      if (newValue.end) setRangeEnd(dayjs(newValue.end))
      if (newValue.start) setCurrentDate(dayjs(newValue.start))
    }
  }, [value, selectionMode])

  // ---------------------------
  // HEADER LABEL
  // ---------------------------
  const headerText =
    selectionMode === 'range'
      ? rangeStart && rangeEnd
        ? `${rangeStart.format('MMM D, YYYY')} → ${rangeEnd.format('MMM D, YYYY')}`
        : 'Select date range'
      : selectedDate.format('ddd, MMMM D')

  // ---------------------------
  // RENDER
  // ---------------------------
  return (
    <div className="fixed inset-0 z-30 flex bg-black/50 items-center justify-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div className="w-80 rounded-2xl shadow-xl bg-[var(--color-card)] text-[var(--color-text)] overflow-hidden">

          {/* Header */}
          <div className="px-5 pt-3 pb-2">
            <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
            <p className="text-lg font-bold text-[var(--color-primary)]">
              {headerText}
            </p>
          </div>

          {/* Top navigation */}
          <div className="flex justify-between items-center px-5 py-3 bg-[var(--color-bg)]">
            <button
              onClick={() => {
                if (mode === 'year') prevYearSet()
                else if (mode === 'month') setCurrentDate(currentDate.subtract(1, 'year'))
                else prevMonth()
              }}
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={() =>
                setMode(mode === 'date' ? 'month' : mode === 'month' ? 'year' : 'date')
              }
              className="font-medium"
            >
              {mode === 'year'
                ? `${years[0]} - ${years[years.length - 1]}`
                : `${monthNames[month]} ${year}`}
            </button>

            <button
              onClick={() => {
                if (mode === 'year') nextYearSet()
                else if (mode === 'month') setCurrentDate(currentDate.add(1, 'year'))
                else nextMonth()
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {mode === 'year' && (
              <div className="grid grid-cols-4 gap-3 text-center text-sm">
                {years.map((y) => (
                  <div
                    key={y}
                    onClick={() => handleYearSelect(y)}
                    className={`cursor-pointer rounded-full py-2 transition-all
                      ${y === year ? 'bg-[var(--color-primary)] text-white font-semibold' : 'hover:bg-[var(--color-primary-hover)] hover:text-white'}
                      ${today.year() === y ? 'border border-white' : ''}
                    `}
                  >
                    {y}
                  </div>
                ))}
              </div>
            )}

            {mode === 'month' && (
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                {monthNames.map((m, i) => (
                  <div
                    key={m}
                    onClick={() => handleMonthSelect(i)}
                    className={`cursor-pointer rounded-full py-2 transition-all
                      ${i === month && year === currentDate.year()
                        ? 'bg-[var(--color-primary)] text-white font-semibold'
                        : 'hover:bg-[var(--color-primary-hover)] hover:text-white'}
                    `}
                  >
                    {m}
                  </div>
                ))}
              </div>
            )}

            {mode === 'date' && (
              <>
                <div className="grid grid-cols-7 text-center text-xs font-medium mb-2">
                  {dayjs.weekdaysShort().map((d) => <div key={d}>{d}</div>)}
                </div>
                <div className={`grid grid-cols-7 gap-y-2 text-center text-sm`}>
                  {renderDays()}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="py-3 flex justify-end px-5">
            <button
              className="px-4 py-1 rounded-lg bg-[var(--color-primary)] text-white"
              onClick={() => {
                if (selectionMode === 'single') {
                  onChange?.(toSafeJsDate(selectedDate))
                } else if (rangeStart && rangeEnd) {
                  onChange?.({
                    start: toSafeJsDate(rangeStart),
                    end: toSafeJsDate(rangeEnd)
                  })
                }
              }}
            >
              Ok
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  )
}
