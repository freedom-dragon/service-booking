import { DAY, MONTH, WEEK } from '@beenotung/tslib/time.js'
import { Service } from '../../../db/proxy.js'

export function formatServiceDuration(service: Service): string {
  let duration_in_minute = service.book_duration_minute
  return duration_in_minute < 60
    ? duration_in_minute + ' 分鐘'
    : (duration_in_minute / 60).toFixed(1).replace('.0', '') + ' 小時'
}

export function formatDuration(time: number): string {
  let value = time / MONTH
  if (Number.isInteger(value)) {
    return value + '個月'
  }
  value = time / WEEK
  if (Number.isInteger(value)) {
    return value + '周'
  }
  value = time / DAY
  return value + '日'
}
