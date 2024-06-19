import { filter } from 'better-sqlite3-proxy'
import { Booking, Service, proxy } from './proxy.js'

// TODO support people amount based discount
export function calcBookingTotalFee(booking: Booking): {
  total_fee: string
  str: string
  is_free: boolean
} {
  let service = booking.service!
  let unit_price = service.unit_price!
  let fee_val =
    booking.amount *
    (service.peer_amount &&
    service.peer_price &&
    booking.amount >= service.peer_amount
      ? +service.peer_price
      : +service.unit_price!)
  if (fee_val == 0) {
    return {
      total_fee: '0',
      str: '$0',
      is_free: true,
    }
  }
  if (fee_val) {
    return {
      total_fee: fee_val.toFixed(0),
      // e.g. '$1,200'
      str: '$' + fee_val.toLocaleString(),
      is_free: false,
    }
  }
  return {
    // e.g. '📐 量身訂做'
    total_fee: '',
    str: unit_price,
    is_free: false,
  }
}

export function isFree(fee: string): boolean {
  return fee == '$0'
}

export function getServiceQuestions(service: Service) {
  return filter(proxy.service_question, { service_id: service.id! }).filter(
    row => row.question.trim(),
  )
}
