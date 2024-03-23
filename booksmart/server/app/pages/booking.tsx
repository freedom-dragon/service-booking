import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { apiEndpointTitle, title } from '../../config.js'
import Style from '../components/style.js'
import {
  Context,
  DynamicContext,
  WsContext,
  getContextFormBody,
} from '../context.js'
import { mapArray } from '../components/fragment.js'
import { IonBackButton } from '../components/ion-back-button.js'
import { id, object, string } from 'cast.ts'
import { Link, Redirect } from '../components/router.js'
import { renderError } from '../components/error.js'
import { getAuthUser } from '../auth/user.js'
import { TimezoneDate } from 'timezone-date.ts'
import { DAY } from '@beenotung/tslib/time.js'
import { appIonTabBar } from '../components/app-tab-bar.js'
import { fitIonFooter, selectIonTab } from '../styles/mobile-style.js'
import { getAuthRole } from '../auth/role.js'
import { Booking, Shop, User, proxy } from '../../../db/proxy.js'
import { count, filter, notNull } from 'better-sqlite3-proxy'
import { timestamp } from '../components/timestamp.js'
import { Swiper } from '../components/swiper.js'
import DateTimeText, { formatDateTimeText } from '../components/datetime.js'
import { toUploadedUrl } from '../upload.js'
import { MessageException } from '../helpers.js'
import { loadClientPlugin } from '../../client-plugin.js'
import { sendEmail } from '../../email.js'
import { toServiceUrl, toShopUrl } from '../app-url.js'
import { getShopLocale } from '../shop-store.js'
import { nodeToVNode } from '../jsx/vnode.js'
import {
  BookingPreview,
  bookingPreviewStyle,
} from '../components/booking-preview.js'
import { getBookingTotalFee } from '../fee.js'
import { env } from '../../env.js'
import { db } from '../../../db/db.js'
import { format_relative_time } from '@beenotung/tslib'
import { Node } from '../jsx/types.js'

let pageTitle = '我的預約'
let addPageTitle = 'Add Calendar'

let style = Style(/* css */ `
hr {
  border-bottom: 1px solid var(--ion-color-dark);
}
.booking--header {
  display: flex;
  justify-content: space-between;
}
.booking--buttons {
  display: flex;
  justify-content: space-around;
}
`)

let page = (
  <>
    {style}
    {bookingPreviewStyle}
    <Page />
    <ion-footer>
      {appIonTabBar}
      {selectIonTab('booking')}
    </ion-footer>
    {fitIonFooter}
  </>
)

function Page(attrs: {}, context: DynamicContext) {
  let { user, shop } = getAuthRole(context)
  return shop ? AdminPage(shop, context) : UserPage(user, context)
}

function BookingDetails(
  attrs: {
    booking: Booking
    timestamp: Node
    open_receipt?: ''
  },
  context: Context,
) {
  let { booking } = attrs
  let receipts = filter(proxy.receipt, {
    booking_id: booking.id!,
  })
  let avatar_url = toUploadedUrl(booking.user!.avatar)
  let fee = getBookingTotalFee(booking)
  let service = booking.service!
  let shop_slug = service.shop!.slug
  let service_slug = service.slug
  return (
    <ion-card>
      <ion-card-content>
        <div class="booking--header">
          <div>
            {avatar_url ? (
              <ion-avatar>
                <img src={avatar_url} loading="lazy" />
              </ion-avatar>
            ) : null}
            <div>{booking.user!.nickname}</div>
          </div>
          {attrs.timestamp}
        </div>
        <div style="color: black">
          <BookingPreview booking={booking} style="margin: 0.25rem 1rem" />
          <div class="ion-margin-top">
            <b>總共費用: {fee.str}</b>
          </div>
        </div>
      </ion-card-content>
      <div class="ion-margin-horizontal">
        <details open={attrs.open_receipt}>
          <summary>
            {receipts.length == 0 ? (
              <span class="ion-margin-bottom">未有上載收據</span>
            ) : (
              <span class="ion-margin-bottom">
                上載了 {receipts.length} 張收據
              </span>
            )}
          </summary>
          {mapArray(receipts, receipt => (
            <div>
              <img
                src={`/assets/shops/${shop_slug}/${service_slug}/receipts/${receipt.filename}`}
                loading="lazy"
              />
            </div>
          ))}
        </details>
        <div class="booking--buttons ion-margin-top">
          <ion-button
            color="primary"
            onclick={`emit('/booking/approve/${booking.id}')`}
          >
            確認
          </ion-button>
          <ion-button
            color="warning"
            // onclick={`emit('/booking/re/${booking.id}')`}
            disabled
          >
            改期
          </ion-button>
          <ion-button
            color="dark"
            onclick={`emit('/booking/reject/${booking.id}')`}
          >
            取消
          </ion-button>
        </div>
      </div>
    </ion-card>
  )
}

function AdminPage(shop: Shop, context: DynamicContext) {
  return (
    <>
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title role="heading" aria-level="1">
            客戶的預約
          </ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content id="BookingTab" class="ion-padding">
        <AdminPageContent shop={shop} />
      </ion-content>
      {loadClientPlugin({ entryFile: 'dist/client/sweetalert.js' }).node}
    </>
  )
}

let select_booking_id_by_shop = db
  .prepare(
    /* sql */ `
select booking.id
from booking
inner join service on service.id = booking.service_id
where service.shop_id = :shop_id
`,
  )
  .pluck()

function AdminPageContent(attrs: { shop: Shop }, context: DynamicContext) {
  let { shop } = attrs

  let booking_ids: number[] = []
  let submitted: Booking[] = []
  let confirmed: Booking[] = []
  let completed: Booking[] = []
  let cancelled: Booking[] = []

  let service_count = count(proxy.service, { shop_id: shop.id! })
  if (service_count > 0) {
    booking_ids = select_booking_id_by_shop.all({
      shop_id: shop.id,
    }) as number[]
    for (let id of booking_ids) {
      let booking = proxy.booking[id]
      if (booking.cancel_time || booking.reject_time) {
        cancelled.push(booking)
      } else if (booking.arrive_time) {
        completed.push(booking)
      } else if (booking.approve_time) {
        confirmed.push(booking)
      } else {
        submitted.push(booking)
      }
    }
  }

  return (
    <>
      <ion-segment value="submitted">
        <ion-segment-button
          value="submitted"
          onclick="swiperSlide(bookingSwiper,'0')"
        >
          未確認 ({submitted.length})
        </ion-segment-button>
        <ion-segment-button
          value="confirmed"
          onclick="swiperSlide(bookingSwiper,'1')"
        >
          未開始 ({confirmed.length})
        </ion-segment-button>
        <ion-segment-button
          value="completed"
          onclick="swiperSlide(bookingSwiper,'2')"
        >
          已完成 ({completed.length})
        </ion-segment-button>
        <ion-segment-button
          value="cancelled"
          onclick="swiperSlide(bookingSwiper,'3')"
        >
          已取消 ({cancelled.length})
        </ion-segment-button>
      </ion-segment>
      {service_count == 0 ? (
        <p class="ion-text-center">未有服務可接受預約</p>
      ) : null}
      {Swiper({
        id: 'bookingSwiper',
        slides: [
          <ion-list data-segment="submitted">
            <p class="ion-margin-start">
              <span class="booking-count">{submitted.length}</span> 個未確認預約
            </p>
            {mapArray(submitted, booking =>
              BookingDetails(
                {
                  booking,
                  timestamp: (
                    <div>提交時間：{timestamp(booking.submit_time)}</div>
                  ),
                },
                context,
              ),
            )}
          </ion-list>,
          <ion-list data-segment="confirmed">
            <p class="ion-margin-start">
              <span class="booking-count">{confirmed.length}</span> 個未開始預約
            </p>
            {mapArray(confirmed, booking =>
              BookingDetails(
                {
                  booking,
                  timestamp: (
                    <div>開始時間：{timestamp(booking.appointment_time)}</div>
                  ),
                },
                context,
              ),
            )}
          </ion-list>,
          <ion-list data-segment="completed">
            <p class="ion-margin-start">
              <span class="booking-count">{completed.length}</span> 個已完成預約
            </p>
            {mapArray(completed, booking =>
              BookingDetails(
                {
                  booking,
                  timestamp: (
                    <div>報到時間：{timestamp(booking.arrive_time!)}</div>
                  ),
                },
                context,
              ),
            )}
          </ion-list>,
          <ion-list data-segment="cancelled">
            <p class="ion-margin-start">
              <span class="booking-count">{cancelled.length}</span> 個已取消預約
            </p>
            {mapArray(cancelled, booking =>
              BookingDetails(
                {
                  booking,
                  timestamp: (
                    <div>
                      取消時間：
                      {timestamp(booking.cancel_time || booking.reject_time!)}
                    </div>
                  ),
                },
                context,
              ),
            )}
          </ion-list>,
        ],
      })}
    </>
  )
}

function UserPage(user: User | null, context: DynamicContext) {
  return (
    <>
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title role="heading" aria-level="1">
            我的預約
          </ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content id="Calendar" class="ion-padding">
        <Main />
      </ion-content>
    </>
  )
}

let items = [
  { title: 'Android', slug: 'md' },
  { title: 'iOS', slug: 'ios' },
]

let calendarStyle = Style(/* css */ `
.calendar--title {
  text-align: center;
}
.calendar--table {
  width: 100%;
}
.calendar--weekdays {
}
.calendar--weekday {
  outline: 1px solid #eee;
}
td.calendar--weekday * {
  width: 100%;
}
td.calendar--weekday ion-button {
  padding: 0.5rem;
}
.calendar--weekday {
  color: var(--ion-color-dark);
}
`)

function getWeeks(date: TimezoneDate) {
  date.setDate(1)
  date.setHours(0, 0, 0, 0)
  let month = date.getMonth()
  date.setTime(date.getTime() - DAY * date.getDay())
  let weeks: string[][] = []
  do {
    let week: string[] = []
    weeks.push(week)
    for (let i = 0; i < 7; i++) {
      if (date.getMonth() != month) {
        week.push('')
      } else {
        week.push(date.getDate().toString())
      }
      date.setTime(date.getTime() + DAY)
    }
  } while (date.getMonth() == month)
  return weeks
}

function Main(attrs: {}, context: Context) {
  let user = getAuthUser(context)
  let date = new TimezoneDate()
  date.timezone = +8
  let weeks = getWeeks(date)
  let todayDate = date.getDate()
  return (
    <>
      {calendarStyle}
      <h2 class="calendar--title">Today</h2>
      <table class="calendar--table" hidden>
        <thead>
          <tr class="calendar--weekdays">
            {mapArray(
              [
                'Sunday',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
              ],
              day => (
                <th class="calendar--weekday" title={day}>
                  {day[0]}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {mapArray(weeks, week => (
            <tr class="calendar--weekdays">
              {mapArray(week, (date, i) => (
                <td class="calendar--weekday">
                  <ion-buttons>
                    <ion-button
                      {...(+date == todayDate
                        ? {
                            fill: 'block',
                            shape: 'round',
                            color: 'primary',
                          }
                        : undefined)}
                    >
                      {date}
                    </ion-button>
                  </ion-buttons>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ion-list-header>Events</ion-list-header>
      <ion-list>
        <ion-item>No events yet.</ion-item>
      </ion-list>
      <ion-list-header hidden>Available Timeslots</ion-list-header>
      <ion-list hidden>
        <ion-item>9am - 12nn</ion-item>
      </ion-list>
      {user ? (
        <Link href="/booking/add" tagName="ion-button">
          {addPageTitle}
        </Link>
      ) : (
        <p hidden>
          You can add event / available timeslot after{' '}
          <Link href="/login">login</Link>.
        </p>
      )}
    </>
  )
}

let addPage = (
  <>
    {Style(/* css */ `
#AddCalendar .hint {
  margin-inline-start: 1rem;
  margin-block: 0.25rem;
}
`)}
    <ion-header>
      <ion-toolbar>
        <IonBackButton href="/booking" backText={pageTitle} />
        <ion-title role="heading" aria-level="1">
          {addPageTitle}
        </ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content id="AddCalendar" class="ion-padding">
      <form
        method="POST"
        action="/booking/add/submit"
        onsubmit="emitForm(event)"
      >
        <ion-list>
          <ion-item>
            <ion-input
              name="title"
              label="Title*:"
              label-placement="floating"
              required
              minlength="3"
              maxlength="50"
            />
          </ion-item>
          <p class="hint">(3-50 characters)</p>
          <ion-item>
            <ion-input
              name="slug"
              label="Slug*: (unique url)"
              label-placement="floating"
              required
              pattern="(\w|-|\.){1,32}"
            />
          </ion-item>
          <p class="hint">
            (1-32 characters of: <code>a-z A-Z 0-9 - _ .</code>)
          </p>
        </ion-list>
        <div style="margin-inline-start: 1rem">
          <ion-button type="submit">Submit</ion-button>
        </div>
        <p>
          Remark:
          <br />
          *: mandatory fields
        </p>
      </form>
    </ion-content>
  </>
)

function AddPage(attrs: {}, context: DynamicContext) {
  let user = getAuthUser(context)
  if (!user) return <Redirect href="/login" />
  return addPage
}

let approveParser = object({
  params: object({ booking_id: id() }),
})

function ApproveBooking(attrs: {}, context: WsContext) {
  try {
    let { user, shop } = getAuthRole(context)
    if (!user) throw 'You must be logged in to approve booking'
    if (!shop) throw 'You must be merchant to approve booking'

    let input = approveParser.parse(context.routerMatch)

    let booking = proxy.booking[input.params.booking_id]
    if (!booking) throw 'Booking not found, id: ' + input.params.booking_id

    if (booking.service!.shop_id != shop.id)
      throw 'You cannot approve booking of another shop'

    let service = booking.service!

    // TODO check quota

    booking.approve_time = Date.now()

    let service_url = toServiceUrl(service)

    sendEmail({
      from: env.EMAIL_USER,
      to: booking.user!.email!,
      cc: user.email!,
      subject: title(`${service!.name}預約確認`),
      html: /* html */ `
<p>
${booking.user!.nickname} 你好，
<b>${user.nickname}</b>
確認了你在
<b>${formatDateTimeText({ time: booking.appointment_time }, context)}</b>
的
<b>${booking.service!.name}</b>
預約。
</p>
<p>
到時見！
</p>
<p>
按此查看詳情：<a href="${service_url}">${service_url}</a>
</p>
`,
      text: `${user.nickname} 取消了原定在 ${formatDateTimeText({ time: booking.appointment_time }, context)} 的 ${booking.service!.name} 預約。期待下次再見！`,
    }).catch(error => {
      context.ws.send([
        'eval',
        `showToast(${JSON.stringify('Failed to send email notice: ' + error)},'error');`,
      ])
    })

    throw new MessageException([
      'batch',
      [
        [
          'eval',
          `showToast('確認了${booking.user!.nickname}的${booking.service!.name}預約','success')`,
        ],
        [
          'update-in',
          '#BookingTab',
          nodeToVNode(AdminPageContent({ shop }, context), context),
        ],
      ],
    ])
  } catch (error) {
    if (error instanceof MessageException) {
      throw error
    }
    throw new MessageException([
      'eval',
      `showToast(${JSON.stringify(String(error))},'error')`,
    ])
  }
}

let rejectParser = object({
  params: object({ booking_id: id() }),
})

function RejectBooking(attrs: {}, context: WsContext) {
  try {
    let { user, shop } = getAuthRole(context)
    if (!user) throw 'You must be logged in to reject booking'
    if (!shop) throw 'You must be merchant to reject booking'

    let input = rejectParser.parse(context.routerMatch)

    let booking = proxy.booking[input.params.booking_id]
    if (!booking) throw 'Booking not found, id: ' + input.params.booking_id

    if (booking.service!.shop_id != shop.id)
      throw 'You cannot reject booking of another shop'

    let service = booking.service!

    booking.reject_time = Date.now()

    let locale = getShopLocale(shop.id!)

    let shop_url = toShopUrl(shop)

    sendEmail({
      from: env.EMAIL_USER,
      to: booking.user!.email!,
      cc: user.email!,
      subject: title(`${service!.name}預約取消`),
      html: /* html */ `
<p>
${booking.user!.nickname} 你好，
<b>${user.nickname}</b>
取消了原定在
<b>${formatDateTimeText({ time: booking.appointment_time }, context)}</b>
的
<b>${booking.service!.name}</b>
預約。
</p>
<p>
期待下次再見！
</p>
<p>
按此預約其他${locale.service}：<a href="${shop_url}">${shop_url}</a>
</p>
`,
      text: `${user.nickname} 取消了原定在 ${formatDateTimeText({ time: booking.appointment_time }, context)} 的 ${booking.service!.name} 預約。期待下次再見！`,
    }).catch(error => {
      context.ws.send([
        'eval',
        `showToast(${JSON.stringify('Failed to send email notice: ' + error)},'error');`,
      ])
    })

    throw new MessageException([
      'batch',
      [
        [
          'eval',
          `showToast('取消了${booking.user!.nickname}的${booking.service!.name}預約','info')`,
        ],
        [
          'update-in',
          '#BookingTab',
          nodeToVNode(AdminPageContent({ shop }, context), context),
        ],
      ],
    ])
  } catch (error) {
    if (error instanceof MessageException) {
      throw error
    }
    throw new MessageException([
      'eval',
      `showToast(${JSON.stringify(String(error))},'error')`,
    ])
  }
}

let submitParser = object({
  title: string({ minLength: 3, maxLength: 50 }),
  slug: string({ match: /^[\w-]{1,32}$/ }),
})

function Submit(attrs: {}, context: DynamicContext) {
  try {
    let user = getAuthUser(context)
    if (!user) throw 'You must be logged in to submit ' + pageTitle
    let body = getContextFormBody(context)
    let input = submitParser.parse(body)
    let id = items.push({
      title: input.title,
      slug: input.slug,
    })
    return <Redirect href={`/booking/result?id=${id}`} />
  } catch (error) {
    return (
      <Redirect
        href={
          '/booking/result?' + new URLSearchParams({ error: String(error) })
        }
      />
    )
  }
}

function SubmitResult(attrs: {}, context: DynamicContext) {
  let params = new URLSearchParams(context.routerMatch?.search)
  let error = params.get('error')
  let id = params.get('id')
  return (
    <>
      <ion-header>
        <ion-toolbar>
          <IonBackButton href="/booking/add" backText="Form" />
          <ion-title role="heading" aria-level="1">
            Submitted {pageTitle}
          </ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content id="AddCalendar" class="ion-padding">
        {error ? (
          renderError(error, context)
        ) : (
          <>
            <p>Your submission is received (#{id}).</p>
            <Link href="/booking" tagName="ion-button">
              Back to {pageTitle}
            </Link>
          </>
        )}
      </ion-content>
    </>
  )
}

let routes: Routes = {
  '/booking': {
    title: title(pageTitle),
    description: 'manage your service booking',
    menuText: pageTitle,
    menuFullNavigate: true,
    node: page,
  },
  '/booking/approve/:booking_id': {
    title: apiEndpointTitle,
    description: 'approve a booking by merchant',
    node: <ApproveBooking />,
    streaming: false,
  },
  '/booking/reject/:booking_id': {
    title: apiEndpointTitle,
    description: 'reject a booking by merchant',
    node: <RejectBooking />,
    streaming: false,
  },
  '/booking/add': {
    title: title(addPageTitle),
    description: 'TODO',
    node: <AddPage />,
    streaming: false,
  },
  '/booking/add/submit': {
    title: apiEndpointTitle,
    description: 'TODO',
    node: <Submit />,
    streaming: false,
  },
  '/booking/result': {
    title: apiEndpointTitle,
    description: 'TODO',
    node: <SubmitResult />,
    streaming: false,
  },
}

export default { routes }
