import { DAY, MINUTE } from '@beenotung/tslib/time.js'
import { db } from '../../db/db.js'
import { Booking, Service, User, proxy } from '../../db/proxy.js'
import { count, notNull } from 'better-sqlite3-proxy'
import {
  fromDatePart,
  fromTimePart,
  toDatePart,
  toTimePart,
} from './format/date.js'
import { d2 } from 'cast.ts'
import { TimezoneDate } from 'timezone-date.ts'
import { getTimeslotIntervalInMinute } from './components/service-timeslot-picker.js'

export type ServiceAvailableDateRow = Record<
  'id' | 'start_date' | 'end_date' | 'weekdays',
  string
>
let select_service_available_date = db.prepare(/* sql */ `
select
  service_timeslot.id
, service_timeslot.start_date
, service_timeslot.end_date
, service_timeslot.weekdays
from service_timeslot
inner join timeslot_hour on timeslot_hour.service_timeslot_id = service_timeslot.id
where service_timeslot.service_id = :service_id
group by service_timeslot.id
having count(timeslot_hour.id) > 0
`)

export function selectAvailableDates(filter: { service_id: number }) {
  let timeslots = select_service_available_date.all(
    filter,
  ) as ServiceAvailableDateRow[]
  return timeslots
}

export type ServiceAvailableHourRow = Record<
  'id' | 'start_time' | 'end_time',
  string
>
let select_service_available_hour = db.prepare(/* sql */ `
select
  timeslot_hour.id
, timeslot_hour.start_time
, timeslot_hour.end_time
from service_timeslot
inner join timeslot_hour on timeslot_hour.service_timeslot_id = service_timeslot.id
where service_timeslot.service_id = :service_id
  and service_timeslot.start_date <= :date and :date <= service_timeslot.end_date
  and service_timeslot.weekdays like :day
`)

type BookingByTimeRow = {
  appointment_time: number
  amount: number
  user_id: number
}
let select_booking_by_time = db.prepare(/* sql */ `
select
  appointment_time, amount, user_id
from booking
where service_id = :service_id
  and approve_time is not null
  and cancel_time is null
  and reject_time is null
  and :start_time <= appointment_time and appointment_time < :end_time
`)

function selectBookedTimeslot(options: {
  service_id: number
  dateString: string
}) {
  let date = fromDatePart(options.dateString)

  let service = proxy.service[options.service_id]
  let service_quota = service.quota
  let service_duration = service.book_duration_minute * MINUTE

  let hours = select_service_available_hour.all({
    service_id: options.service_id,
    date: options.dateString,
    day: '%' + '日一二三四五六'[date.getDay()] + '%',
  }) as ServiceAvailableHourRow[]

  let bookings = select_booking_by_time.all({
    service_id: options.service_id,
    start_time: date.getTime(),
    end_time: date.getTime() + DAY,
  }) as BookingByTimeRow[]

  let used = bookings.map(booking => {
    return {
      start_time: toTimePart(booking.appointment_time),
      end_time: toTimePart(booking.appointment_time + service_duration),
      amount: booking.amount,
    }
  })

  return { service_quota, hours, used, service_duration }
}

export type AvailableHour = {
  start_time: string
  end_time: string
  quota: number
}
export function selectAvailableHours(options: {
  service_id: number
  dateString: string
}): AvailableHour[] {
  let { service_quota, hours, used, service_duration } =
    selectBookedTimeslot(options)

  let booking_time_step_ms =
    getTimeslotIntervalInMinute(proxy.service[options.service_id]) * MINUTE

  let available: AvailableHour[] = []

  for (let hour of hours) {
    let date = fromTimePart(hour.start_time)

    console.log(
      'date',
      date.toString(),
      new Date(booking_time_step_ms).toString(),
      hour,
    )
    for (; ; date.setTime(date.getTime() + booking_time_step_ms)) {
      let start_time = d2(date.getHours()) + ':' + d2(date.getMinutes())
      let end_date = new TimezoneDate(date.getTime() + service_duration)
      end_date.timezone = +8
      let end_time = d2(end_date.getHours()) + ':' + d2(end_date.getMinutes())
      if (end_time <= start_time) {
        /* overflow to next day */
        break
      }

      let slot_time = { start_time, end_time }

      let quota = service_quota

      for (let booking of used) {
        if (isOverlap(slot_time, booking)) {
          // TODO multiply by quota weight
          quota -= booking.amount
        }
      }

      if (quota > 0) {
        available.push({ start_time, end_time, quota })
      }
    }
  }

  return available
}

export function selectAvailableQuota(options: {
  service_id: number
  appointment_time: number
}) {
  let { service_quota, hours, used } = selectBookedTimeslot({
    service_id: options.service_id,
    dateString: toDatePart(new TimezoneDate(options.appointment_time)),
  })

  if (hours.length === 0) return 0

  return Math.min(
    ...hours.map(hour => {
      let quota = service_quota
      for (let booking of used) {
        if (isOverlap(hour, booking)) {
          // TODO multiply by quota weight
          quota -= booking.amount
        }
      }
      return quota
    }),
  )
}

/** @description count number of used package/plan */
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

export function isOverlap(
  a: { start_time: string; end_time: string },
  b: { start_time: string; end_time: string },
) {
  // aa bb
  if (a.end_time <= b.start_time) return false

  // bb aa
  if (b.end_time <= a.start_time) return false

  return true
}
