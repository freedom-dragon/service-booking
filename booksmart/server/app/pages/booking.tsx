import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { apiEndpointTitle, title } from '../../config.js'
import Style from '../components/style.js'
import { Context, DynamicContext, getContextFormBody } from '../context.js'
import { mapArray } from '../components/fragment.js'
import { IonBackButton } from '../components/ion-back-button.js'
import { object, string } from 'cast.ts'
import { Link, Redirect } from '../components/router.js'
import { renderError } from '../components/error.js'
import { getAuthUser } from '../auth/user.js'
import { TimezoneDate } from 'timezone-date.ts'
import { DAY } from '@beenotung/tslib/time.js'
import { appIonTabBar } from '../components/app-tab-bar.js'
import { fitIonFooter, selectIonTab } from '../styles/mobile-style.js'
import { getAuthRole } from '../auth/role.js'
import { Shop, User, proxy } from '../../../db/proxy.js'
import { filter, notNull } from 'better-sqlite3-proxy'
import { timestamp } from '../components/timestamp.js'
import { Swiper } from '../components/swiper.js'
import DateTimeText from '../components/datetime.js'
import { toUploadedUrl } from '../upload.js'

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

function AdminPage(shop: Shop, context: DynamicContext) {
  let shop_slug = shop.slug
  let services = filter(proxy.service, { shop_id: shop.id! })
  let submitted = services
    .map(service => ({
      service,
      bookings: filter(proxy.booking, {
        service_id: service.id!,
        cancel_time: null,
        approve_time: null,
        reject_time: null,
      }),
    }))
    .filter(item => item.bookings.length > 0)
  let confirmed = services.map(service => ({
    service,
    bookings: filter(proxy.booking, {
      service_id: service.id!,
      cancel_time: null,
      approve_time: notNull,
      reject_time: null,
    }),
  }))
  let now = Date.now()
  let notCompleted = confirmed
    .map(({ service, bookings }) => ({
      service,
      bookings: bookings.filter(booking => booking.appointment_time <= now),
    }))
    .filter(item => item.bookings.length > 0)
  let completed = confirmed
    .map(({ service, bookings }) => ({
      service,
      bookings: bookings.filter(booking => booking.appointment_time > now),
    }))
    .filter(item => item.bookings.length > 0)
  let cancelled = services
    .map(service => ({
      service,
      bookings: Array.from(
        new Set([
          ...filter(proxy.booking, {
            service_id: service.id!,
            cancel_time: notNull,
          }),
          ...filter(proxy.booking, {
            service_id: service.id!,
            reject_time: notNull,
          }),
        ]),
      ),
    }))
    .filter(item => item.bookings.length > 0)
  return (
    <>
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title role="heading" aria-level="1">
            客戶的預約
          </ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content id="Calendar" class="ion-padding">
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
            未開始 ({notCompleted.length})
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
        {services.length == 0 ? (
          <p class="ion-text-center">未有服務可接受預約</p>
        ) : null}
        {Swiper({
          id: 'bookingSwiper',
          slides: [
            <ion-list data-segment="submitted">
              {submitted.length == 0 ? (
                <p class="ion-margin-start">未有</p>
              ) : (
                mapArray(submitted, ({ service, bookings }) => {
                  let service_slug = service.slug
                  return (
                    <>
                      <ion-list-header>{service.name}</ion-list-header>
                      <p class="ion-margin-start">
                        {bookings.length} 個未確認預約
                      </p>
                      {mapArray(bookings, booking => {
                        let receipts = filter(proxy.receipt, {
                          booking_id: booking.id!,
                        })
                        let avatar_url = toUploadedUrl(booking.user!.avatar)
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
                                <div>
                                  提交時間：{timestamp(booking.submit_time)}
                                </div>
                              </div>
                              <div class="ion-margin-top">
                                預約時間：
                                <DateTimeText time={booking.appointment_time} />
                              </div>
                            </ion-card-content>
                            <div class="ion-margin-horizontal">
                              {receipts.length == 0 ? (
                                <div class="ion-margin-bottom">
                                  未有上載收據
                                </div>
                              ) : (
                                <div class="ion-margin-bottom">
                                  上載了 {receipts.length} 張收據
                                </div>
                              )}
                              {mapArray(receipts, receipt => (
                                <div>
                                  <img
                                    src={`/assets/shops/${shop_slug}/${service_slug}/receipts/${receipt.filename}`}
                                    loading="lazy"
                                  />
                                </div>
                              ))}
                              <div class="booking--buttons">
                                <ion-button
                                  color="primary"
                                  onclick={`emit('/booking/confirm/${booking.id}')`}
                                >
                                  確認
                                </ion-button>
                                <ion-button color="warning">改期</ion-button>
                                <ion-button color="dark">取消</ion-button>
                              </div>
                            </div>
                          </ion-card>
                        )
                      })}
                    </>
                  )
                })
              )}
            </ion-list>,
            <ion-list data-segment="confirmed">
              {notCompleted.length == 0 ? (
                <p class="ion-margin-start">未有</p>
              ) : (
                mapArray(notCompleted, ({ service, bookings }) => (
                  <>
                    <ion-list-header>{service.name}</ion-list-header>
                    {mapArray(bookings, booking => (
                      <ion-item>
                        <ion-label>{booking.user!.nickname}</ion-label>
                        <ion-note>
                          預約時間：{timestamp(booking.approve_time!)}
                        </ion-note>
                      </ion-item>
                    ))}
                  </>
                ))
              )}
            </ion-list>,
            <ion-list data-segment="completed">
              {completed.length == 0 ? (
                <p class="ion-margin-start">未有</p>
              ) : (
                mapArray(completed, ({ service, bookings }) => (
                  <>
                    <ion-list-header>{service.name}</ion-list-header>
                    {mapArray(bookings, booking => (
                      <ion-item>
                        <ion-label>{booking.user!.nickname}</ion-label>
                        <ion-note>
                          預約時間：{timestamp(booking.approve_time!)}
                        </ion-note>
                      </ion-item>
                    ))}
                  </>
                ))
              )}
            </ion-list>,
            <ion-list data-segment="cancelled">
              {cancelled.length == 0 ? (
                <p class="ion-margin-start">未有</p>
              ) : (
                mapArray(cancelled, ({ service, bookings }) => (
                  <>
                    <ion-list-header>{service.name}</ion-list-header>
                    {mapArray(bookings, booking => (
                      <ion-item>
                        <ion-label>{booking.user!.nickname}</ion-label>
                        <ion-note>
                          取消時間：
                          {timestamp(
                            booking.reject_time || booking.cancel_time!,
                          )}
                        </ion-note>
                      </ion-item>
                    ))}
                  </>
                ))
              )}
            </ion-list>,
          ],
        })}
      </ion-content>
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
    description: 'TODO',
    menuText: pageTitle,
    menuFullNavigate: true,
    node: page,
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
