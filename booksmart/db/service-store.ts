import { Booking } from './proxy'

// TODO support people amount based discount
export function calcBookingTotalFee(booking: Booking): {
  total_fee: number
  str: string
  is_free: boolean
} {
  let service = booking.service!
  let unit_price = service.unit_price!
  let fee_val = +unit_price
  if (fee_val == 0) {
    return {
      total_fee: fee_val,
      str: '$0',
      is_free: true,
    }
  }
  if (fee_val) {
    return {
      // e.g. '$1,200'
      total_fee: fee_val * booking.amount,
      str: '$' + (fee_val * booking.amount).toLocaleString(),
      is_free: false,
    }
  }
  return {
    // e.g. '📐 量身訂做'
    total_fee: 0,
    str: unit_price,
    is_free: false,
  }
}

export function isFree(fee: string): boolean {
  return fee == '$0'
}
