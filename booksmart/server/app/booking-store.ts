import { Booking, Service, User, proxy } from '../../db/proxy.js'
import { count, notNull } from 'better-sqlite3-proxy'

export function countBooking(options: {
  service: Service
  user?: User | null
}) {
  let times = options.service.times || 1
  let filter: Partial<Booking> = {
    service_id: options.service.id!,
    approve_time: notNull,
    cancel_time: null,
    reject_time: null,
  }
  if (options.user) {
    filter.user_id = options.user.id!
  }
  let total_used = count(proxy.booking, filter)
  let used = total_used % times
  return { used, total_used, times }
}
