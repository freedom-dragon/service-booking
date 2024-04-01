import { d2 } from 'cast.ts'
import { TimezoneDate } from 'timezone-date.ts'

export function formatHKDateString(time: number): string {
  let date = new TimezoneDate(time)
  date.timezone = +8
  let y = date.getFullYear()
  let m = d2(date.getMonth() + 1)
  let d = d2(date.getDate())
  return `${y}-${m}-${d}`
}
