import { Booking, Service } from '../../../db/proxy.js'
import { Context } from '../context.js'
import { concatClassNames, flagsToClassName } from '../jsx/html.js'
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
.booking-preview td ion-icon {
  width: 1rem;
  height: 1rem;
  margin-inline-end: 0.5rem;
}
`)

export function BookingPreview(
  attrs: { booking: Booking; style?: string; class?: string },
  context: Context,
) {
  let { booking } = attrs
  let service = booking.service!
  let service_option = booking.service_option
  let locale = getShopLocale(service.shop_id)
  return (
    <table
      class={concatClassNames('booking-preview', attrs.class)}
      style={attrs.style}
    >
      <tbody>
        <tr>
          <td>
            <ion-icon name="planet-outline"></ion-icon>
            {locale.service}:
          </td>
          <td>{service.name}</td>
        </tr>
        <tr>
          <td>
            <ion-icon name="people-outline"></ion-icon>
            人數:
          </td>
          <td>
            {booking.amount} {service.price_unit}
          </td>
        </tr>
        {service_option ? (
          <tr>
            <td style="text-align: end_">
              <ion-icon name="options-outline"></ion-icon>
              款式:
            </td>
            <td>{service_option.name}</td>
          </tr>
        ) : null}
        <tr>
          <td>
            <ion-icon name="calendar-outline"></ion-icon>
            日期:
          </td>
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
          <td>
            <ion-icon name="time-outline"></ion-icon>
            時間:
          </td>
          <td>
            {toLocaleDateTimeString(booking.appointment_time, context, {
              hour: '2-digit',
              hour12: false,
              minute: '2-digit',
            })}
          </td>
        </tr>
        <tr>
          <td>
            <ion-icon name="hourglass-outline"></ion-icon>
            時長:
          </td>
          <td>{service.hours}</td>
        </tr>
      </tbody>
    </table>
  )
}
