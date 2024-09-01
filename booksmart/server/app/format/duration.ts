import { Service } from '../../../db/proxy.js'

export function formatServiceDuration(service: Service): string {
  let duration_in_minute = service.book_duration_minute
  return duration_in_minute < 60
    ? duration_in_minute + ' 分鐘'
    : (duration_in_minute / 60).toFixed(1).replace('.0', '') + ' 小時'
}
