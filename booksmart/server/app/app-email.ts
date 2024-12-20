import { Booking } from '../../db/proxy.js'
import { title } from '../config.js'
import { sendEmail } from '../email.js'
import { env } from '../env.js'
import { toRouteUrl } from '../url.js'
import { formatDateTimeText } from './components/datetime.js'
import { Context } from './context.js'
import BookingPage from './pages/booking.js'

export function noticeBookingSubmit(booking: Booking, context: Context) {
  let service = booking.service!
  let user = booking.user!
  let shop = service.shop!
  let owner = shop.owner!
  let booking_url =
    env.ORIGIN +
    toRouteUrl(BookingPage.routes, '/shop/:shop_slug/booking', {
      params: {
        shop_slug: shop.slug,
      },
    })
  sendEmail({
    from: env.EMAIL_USER,
    to: owner.email!,
    cc: user.email!,
    subject: title(`${service!.name} 預約提交`),
    html: /* html */ `
<p>
<b>${user.nickname}</b>
提交了
<b>${service.name}</b>
的預約申請。
</p>
<p>
預約時間：${formatDateTimeText({ time: booking.appointment_time }, context)}
</p>
<p>
按此查看詳情：<a href="${booking_url}">${booking_url}</a>
</p>
`,
    text: `${user.nickname} 預約了 ${service.name}`,
  }).catch(error => {
    if (context.type === 'ws') {
      context.ws.send([
        'eval',
        `showToast(${JSON.stringify('Failed to send email notice: ' + String(error))},'error')`,
      ])
    }
  })
}

export function noticeBookingReceiptSubmit(booking: Booking, context: Context) {
  let service = booking.service!
  let user = booking.user!
  let shop = service.shop!
  let owner = shop.owner!
  let booking_url =
    env.ORIGIN +
    toRouteUrl(BookingPage.routes, '/shop/:shop_slug/booking', {
      params: {
        shop_slug: shop.slug,
      },
    })
  sendEmail({
    from: env.EMAIL_USER,
    to: owner.email!,
    subject: title(`${user.nickname} 提交了 ${service!.name} 的預約收據`),
    html: /* html */ `
<p>
<b>${user.nickname}</b>
提交了
<b>${service.name}</b>
的預約收據。
</p>
<p>
預約時間：${formatDateTimeText({ time: booking.appointment_time }, context)}
</p>
<p>
按此查看詳情：<a href="${booking_url}">${booking_url}</a>
</p>
`,
  }).catch(error => {
    if (context.type === 'ws') {
      context.ws.send([
        'eval',
        `showToast(${JSON.stringify('Failed to send email notice: ' + String(error))},'error')`,
      ])
    }
  })
}
