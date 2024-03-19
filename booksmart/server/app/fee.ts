import { Booking } from '../../db/proxy.js'

export function getBookingTotalFee(booking: Booking) {
  let service = booking.service!
  let unit_price = service.unit_price!
  let fee_val = +unit_price
  if (fee_val == 0) {
    return {
      str: '$0',
      is_free: true,
    }
  }
  if (fee_val) {
    return {
      // e.g. '$1,200'
      str: '$' + (fee_val * booking.amount).toLocaleString(),
      is_free: false,
    }
  }
  return {
    // e.g. '📐 量身訂做'
    str: unit_price,
    is_free: false,
  }
}

export function isFree(fee: string): boolean {
  return fee == '$0'
}
