import { filter } from 'better-sqlite3-proxy'
import { Booking, proxy } from '../../../db/proxy.js'
import { countBooking } from '../booking-store.js'
import { Context } from '../context.js'
import { formatDuration } from '../format/duration.js'
import { concatClassNames } from '../jsx/html.js'
import { o } from '../jsx/jsx.js'
import { getShopLocale } from '../shop-store.js'
import { toLocaleDateTimeString } from './datetime.js'
import { mapArray } from './fragment.js'
import Style from './style.js'
import { Tel } from './tel.js'

export let bookingPreviewStyle = Style(/* css */ `
.booking-preview tr {
  border-bottom: 1px solid #00000055;
}
.booking-preview td {
  padding: 0.25rem;
  min-width: 5rem;
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
  let user = booking.user!
  let service = booking.service!
  let service_option = booking.service_option
  let locale = getShopLocale(service.shop_id)
  let answers = filter(proxy.booking_answer, { booking_id: booking.id! })
  let { used, times } = countBooking({ service, user })
  let table = (
    <table>
      <tbody>
        <tr>
          <td>
            <ion-icon name="planet-outline"></ion-icon>
            {locale.service}:
          </td>
          <td>{service.name}</td>
        </tr>
        {times == 1 ? (
          <tr>
            <td>
              <ion-icon name="people-outline"></ion-icon>
              人數:
            </td>
            <td>
              {booking.amount} {service.price_unit}
            </td>
          </tr>
        ) : (
          <tr>
            <td>
              <ion-icon name="copy-outline"></ion-icon>
              次數:
            </td>
            <td>
              {used ? (
                <>
                  {used}/{times}
                </>
              ) : (
                times
              )}
            </td>
          </tr>
        )}
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
          <td>{formatDuration(service)}</td>
        </tr>
        <tr>
          <td>
            <ion-icon name="happy-outline"></ion-icon>
            名稱:
          </td>
          <td>{user.nickname}</td>
        </tr>
        <tr>
          <td>
            <ion-icon name="call-outline"></ion-icon>
            電話:
          </td>
          <td>{Tel(user.tel!)}</td>
        </tr>
        <tr>
          <td>
            <ion-icon name="at-outline"></ion-icon>
            電郵:
          </td>
          <td style="max-width: 20ch">
            {mapArray(
              user.email!.split('@'),
              s =>
                mapArray(
                  s.split('.'),
                  s =>
                    mapArray(
                      s.split('-'),
                      s => mapArray(s.split('_'), s => <span>{s}</span>, '_'),
                      '-',
                    ),
                  '.',
                ),
              '@',
            )}
          </td>
        </tr>
      </tbody>
    </table>
  )
  return (
    <div
      class={concatClassNames('booking-preview', attrs.class)}
      style={attrs.style}
    >
      {table}
      {mapArray(answers, (answer, index) => (
        <table>
          <tbody>
            <tr>
              <td style="vertical-align: baseline">
                <ion-icon name="help-circle-outline"></ion-icon>
                備註{index + 1}:
              </td>
              <td>
                <p>{answer.service_question?.question}</p>
                <hr />
                <p>{answer.answer || '(沒有回答)'}</p>
              </td>
            </tr>
          </tbody>
        </table>
      ))}
    </div>
  )
}
