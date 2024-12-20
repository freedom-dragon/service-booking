import { d2 } from 'cast.ts'
import { TimezoneDate } from 'timezone-date.ts'

export function formatHKDateString(time: number): string {
  let date = new TimezoneDate(time)
  return toDatePart(date)
}

export function toDatePart(date: TimezoneDate) {
  date.timezone = +8
  let y = date.getFullYear()
  let m = d2(date.getMonth() + 1)
  let d = d2(date.getDate())
  return `${y}-${m}-${d}`
}

export function fromDatePart(dateStr: string) {
  let date = new TimezoneDate()
  date.timezone = +8
  date.setHours(0, 0, 0, 0)
  let parts = dateStr.split('-')
  let y = +parts[0]
  let m = +parts[1] - 1
  let d = +parts[2]
  date.setFullYear(y, m, d)
  return date
}

export function toTimePart(time: number) {
  let date = new TimezoneDate(time)
  date.timezone = +8
  let h = d2(date.getHours())
  let m = d2(date.getMinutes())
  return `${h}:${m}`
}

export function fromTimePart(timeStr: string) {
  let date = new TimezoneDate()
  date.timezone = +8
  let [h, m] = timeStr.split(':')
  date.setHours(+h, +m, 0, 0)
  return date
}
