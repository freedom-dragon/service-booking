import { Booking, Service } from '../../../db/proxy.js'
import { Context } from '../context.js'
import { o } from '../jsx/jsx.js'
import { ShopLocales, getShopLocale } from '../shop-store.js'
import { toLocaleDateTimeString } from './datetime.js'
import { renderError } from './error.js'
import Style from './style.js'

export let bookingPreviewStyle = Style(/* css */ `
.booking-preview tr {
  border-bottom: 1px solid #00000055;
}
.booking-preview td {
  padding: 0.25rem;
}
`)

export function BookingPreview(booking: Booking, context: Context) {
  let service = booking.service!
  let service_option = booking.service_option
  let locale = getShopLocale(service.shop_id)
  return (
    <>
      <table class="booking-preview">
        <tbody>
          <tr>
            <td>預約{locale.service}:</td>
            <td>{service.name}</td>
          </tr>
          <tr>
            <td>預約人數:</td>
            <td>
              {booking.amount} {service.price_unit}
            </td>
          </tr>
          {service_option ? (
            <tr>
              <td style="text-align: end_">款式:</td>
              <td>{service_option.name}</td>
            </tr>
          ) : null}
          <tr>
            <td>預約日期:</td>
            <td>
              {toLocaleDateTimeString(booking.appointment_time, context, {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </td>
          </tr>
          <tr>
            <td>預約時間:</td>
            <td>
              {toLocaleDateTimeString(booking.appointment_time, context, {
                hour: '2-digit',
                hour12: false,
                minute: '2-digit',
              })}
            </td>
          </tr>
          <tr>
            <td>時長:</td>
            <td>{service.hours}</td>
          </tr>
        </tbody>
      </table>
    </>
  )
}
