import { Service, User, proxy } from '../../db/proxy.js'
import { count } from 'better-sqlite3-proxy'

export function countBooking(options: {
  service: Service
  user?: User | null
}) {
  let times = options.service.times || 1
  let total_used = count(
    proxy.booking,
    options.user
      ? {
          service_id: options.service.id!,
          user_id: options.user.id!,
        }
      : {
          service_id: options.service.id!,
        },
  )
  let used = total_used % times
  return { used, total_used, times }
}
