import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { apiEndpointTitle, title } from '../../config.js'
import Style from '../components/style.js'
import { Context, DynamicContext, WsContext } from '../context.js'
import { mapArray } from '../components/fragment.js'
import { date, dateString, id, object, optional, values } from 'cast.ts'
import { Link } from '../components/router.js'
import { getAuthUser } from '../auth/user.js'
import { TimezoneDate } from 'timezone-date.ts'
import { DAY } from '@beenotung/tslib/time.js'
import { AppTabBar } from '../components/app-tab-bar.js'
import { fitIonFooter, selectIonTab } from '../styles/mobile-style.js'
import { getAuthRole } from '../auth/role.js'
import { Booking, Shop, User, proxy } from '../../../db/proxy.js'
import { count, filter } from 'better-sqlite3-proxy'
import { relative_timestamp } from '../components/timestamp.js'
import { Swiper } from '../components/swiper.js'
import { formatDateTimeText } from '../components/datetime.js'
import { toUploadedUrl } from '../upload.js'
import { MessageException } from '../../exception.js'
import { loadClientPlugin } from '../../client-plugin.js'
import { sendEmail } from '../../email.js'
import { toServiceUrl, toShopUrl } from '../app-url.js'
import { getShopLocale } from '../shop-store.js'
import { nodeToVNode } from '../jsx/vnode.js'
import {
  BookingPreview,
  bookingPreviewStyle,
} from '../components/booking-preview.js'
import { formatPrice } from '../format/price.js'
import { env } from '../../env.js'
import { db } from '../../../db/db.js'
import { Node } from '../jsx/types.js'
import { ServerMessage } from '../../../client/types.js'
import { ServiceTimeslotPicker } from '../components/service-timeslot-picker.js'
import { Script } from '../components/script.js'
import { formatHKDateString } from '../format/date.js'
import { countBooking } from '../booking-store.js'
import { formatDuration } from '../format/duration.js'
import { loginRouteUrl } from './login.js'
import { IonButton } from '../components/ion-button.js'
import { toRouteUrl } from '../../url.js'
import { getContextShop, getContextShopSlug } from '../auth/shop.js'

let pageTitle = '我的預約'
let addPageTitle = 'Add Calendar'

let submitted_pink = '#ff000040'
let confirmed_orange = '#f08040'
let finished_green =
  'oklab(0.617439365900682 -0.127896775919671 0.0463667342516891)'
let cancelled_gray = '#40404040'

let style = Style(/* css */ `
hr {
  /* border-bottom: 1px solid var(--ion-color-dark); */
}

/* booking list item */
.booking--header {
  display: flex;
  justify-content: space-between;
}
.booking--buttons {
  display: flex;
  justify-content: space-around;
}

/* reschedule modal */
ion-item [slot="start"] {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
ion-item [slot="start"] ion-icon {
  width: 1.25rem;
  height: 1.25rem;
}
ion-modal.modal-default.show-modal ~ ion-modal.modal-default {
  --backdrop-opacity: 0.4;
}

/* calendar guide */
#calendarModal .color-guide {
  display: flex;
  gap: 0.25rem;
}
#calendarGuidePopover ion-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.color-box {
  display: inline-block;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.5rem;
}
`)

let page = (
  <>
    {style}
    {bookingPreviewStyle}
    <ion-modal id="calendarModal">
      <ion-datetime
        id="calendarPicker"
        presentation="date"
        show-default-buttons="true"
        done-text="選擇日期"
        cancel-text="顯示全部"
      >
        <div slot="title">
          <div style="display: flex; margin-bottom: 0.5rem; justify-content: space-between">
            {mapArray(
              [
                {
                  label: '未確認',
                  color: submitted_pink,
                },
                {
                  label: '未開始',
                  color: confirmed_orange,
                },
                {
                  label: '已完成',
                  color: finished_green,
                },
                {
                  label: '已取消',
                  color: cancelled_gray,
                },
              ],
              item => (
                <div class="color-guide">
                  <div
                    class="color-box"
                    style={'background-color: ' + item.color}
                  ></div>
                  {item.label}
                </div>
              ),
            )}
          </div>
        </div>
      </ion-datetime>
    </ion-modal>
    <FilterUrl />
    <Page />
    <ion-footer>
      <AppTabBar />
      {selectIonTab('booking')}
    </ion-footer>
    {fitIonFooter}
    {
      loadClientPlugin({
        entryFile: 'dist/client/image.js',
      }).node
    }
    {Script(/* javascript */ `
function fixCalendarHeader() {
  let root = document.querySelector('#calendarPicker')

  let node = root?.shadowRoot?.querySelector('.datetime-header')
  if (!node) return requestAnimationFrame(fixCalendarHeader)
  node.style.paddingBottom = '0.5rem'
  // node.style.display = 'flex'
  // node.style.flexDirection = 'row-reverse'
  // node.style.justifyContent = 'space-between'

  node = root?.shadowRoot.querySelector('.datetime-selected-date')
  if (!node) return requestAnimationFrame(fixCalendarHeader)
  node.style.marginTop = '0'
  node.style.fontSize = '1.5rem'
}
requestAnimationFrame(fixCalendarHeader)
calendarPicker.addEventListener('ionChange', event => {
  let value = event.detail.value.split('T')[0]
  document.querySelector('ion-datetime-button[datetime="calendarPicker"] [slot="date-target"]').textContent = value
  emit(window.booking_filter_url+'?date='+value)
  showLoading()
})
calendarPicker.addEventListener('ionCancel', event => {
  document.querySelector('ion-datetime-button[datetime="calendarPicker"] [slot="date-target"]').textContent = '顯示全部'
  emit(window.booking_filter_url)
  showLoading()
})
function showLoading() {
  let loading = document.createElement('ion-loading')
  document.body.appendChild(loading)
  loading.message = 'Loading...'
  loading.present()
  if (!('loadings' in window)) {
    window.loadings = []
  }
  window.loadings.push(loading)
}
function hideLoading() {
  window.loadings?.forEach(loading => loading.dismiss())
  window.loadings = []
}
async function uploadReceipt(url) {
  let images = await selectReceiptImages()
  let formData = new FormData()
  for (let image of images) {
    formData.append('file', image.file)
  }
  let res = await upload(url, formData)
  let json = await res.json()
  if (json.error) {
    showToast(json.error, 'error')
    return
  }
  if (json.message) {
    onServerMessage(json.message)
  }
}
`)}
  </>
)

function FilterUrl(attrs: {}, context: DynamicContext) {
  let shop_slug = getContextShopSlug(context)
  return Script(/* javascript */ `
window.booking_filter_url = ${toRouteUrl(
    routes,
    '/shop/:shop_slug/booking/filter',
    {
      params: {
        shop_slug,
      },
      json: true,
    },
  )}
`)
}

let topMenuButtons = (
  <ion-buttons slot="end">
    <ion-button onclick="calendarModal.present()">
      <ion-icon slot="icon-only" name="calendar"></ion-icon>
    </ion-button>
  </ion-buttons>
)
let calendarFilterItem = (
  <ion-item lines="none">
    <ion-label>預約日期過濾器</ion-label>
    <ion-datetime-button datetime="calendarPicker" slot="end">
      <span slot="date-target">顯示全部</span>
    </ion-datetime-button>
  </ion-item>
)

type DateColors = {
  textColor?: string
  backgroundColor?: string
}

function calendarScript(attrs: { appointment_dates: Map<string, DateColors> }) {
  return /* javascript */ `
var appointment_dates = new Map(${JSON.stringify(Array.from(attrs.appointment_dates))});
calendarPicker.isDateEnabled = dateString => {
  return appointment_dates.has(dateString)
};
calendarPicker.highlightedDates = Array.from(appointment_dates)
  .map(([date,color])=>({
    date,
    ...color
  }))
`
}

function Page(attrs: {}, context: DynamicContext) {
  let { shop, user, is_owner } = getAuthRole(context)
  return is_owner ? AdminPage(shop, context) : UserPage(user, context)
}

function BookingDetails(attrs: {
  booking: Booking
  timestamp: Node
  open_receipt?: boolean
  can_confirm?: boolean
  can_arrive?: boolean
  can_reschedule?: boolean
  can_reject?: boolean
  search: string
}) {
  let { booking } = attrs
  let booking_id = booking.id!
  let receipts = filter(proxy.receipt, { booking_id })
  let avatar_url = toUploadedUrl(booking.user!.avatar)
  let service = booking.service!
  let shop_slug = service.shop!.slug
  let service_slug = service.slug
  let serviceUrl = `/shop/${shop_slug}/service/${service_slug}`
  let locale = getShopLocale(service.shop_id)
  let { used } = countBooking({ service, user: booking.user })
  let need_pay = used == 0
  return (
    <ion-card data-booking-id={booking.id}>
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
        <div style="margin: 0.25rem 1rem">預約資料</div>
        <div style="color: black">
          <BookingPreview booking={booking} style="margin: 0.25rem 1rem" />
          {need_pay ? (
            <div class="ion-margin-top">
              <b>總共費用: {formatPrice(booking.total_price)}</b>
            </div>
          ) : null}
        </div>
      </ion-card-content>
      <div class="ion-margin-horizontal">
        {need_pay ? (
          <details open={attrs.open_receipt} class="ion-margin-bottom">
            <summary>
              <span class="ion-margin-bottom receipt-desc">
                {receipts.length == 0
                  ? '未有上載收據'
                  : `上載了 ${receipts.length} 張收據`}
              </span>
              <div>
                <ion-button
                  color="primary"
                  onclick={`uploadReceipt('${serviceUrl}/receipt?booking_id=${booking.id}&from=booking')`}
                  size="small"
                >
                  <ion-icon name="cloud-upload" slot="start"></ion-icon>
                  新增付款證明
                </ion-button>
              </div>
            </summary>
            {mapArray(receipts, receipt =>
              ReceiptImageItem(shop_slug, service_slug, receipt.filename),
            )}
          </details>
        ) : null}
        <div class="booking--buttons">
          {attrs.can_confirm ? (
            <IonButton
              color="success"
              url={toRouteUrl(
                routes,
                '/shop/:shop_slug/booking/:booking_id/manage/:action',
                {
                  params: {
                    shop_slug,
                    booking_id,
                    action: 'approve',
                  },
                  search: attrs.search,
                },
              )}
            >
              確認
            </IonButton>
          ) : null}
          {attrs.can_arrive ? (
            <IonButton
              color="success"
              url={toRouteUrl(
                routes,
                '/shop/:shop_slug/booking/:booking_id/manage/:action',
                {
                  params: {
                    shop_slug,
                    booking_id,
                    action: 'arrive',
                  },
                  search: attrs.search,
                },
              )}
            >
              報到
            </IonButton>
          ) : null}
          {attrs.can_reschedule
            ? (() => {
                let modal = `rescheduleModal${booking.id}`
                return (
                  <>
                    <ion-button color="warning" onclick={`${modal}.present()`}>
                      改期
                    </ion-button>
                    <ion-modal id={modal}>
                      <ion-header>
                        <ion-toolbar>
                          <ion-buttons slot="start">
                            <ion-button onclick={`${modal}.dismiss()`}>
                              返回
                            </ion-button>
                          </ion-buttons>
                          <ion-title>預約改期</ion-title>
                        </ion-toolbar>
                      </ion-header>
                      <ion-content color="light">
                        <form id={`bookingForm${booking.id}`}>
                          <ion-list lines="full" inset="true">
                            <ion-item>
                              <div slot="start">
                                <ion-icon name="planet-outline"></ion-icon>
                                {locale.service}
                              </div>
                              <ion-label>{service.name}</ion-label>
                            </ion-item>
                            <ion-item>
                              <div slot="start">
                                <ion-icon name="people-outline"></ion-icon>
                                人數:
                              </div>
                              <ion-label>
                                {booking.amount} {service.price_unit}
                              </ion-label>
                            </ion-item>
                            <ion-item>
                              <div slot="start">
                                <ion-icon name="happy-outline"></ion-icon>
                                名稱
                              </div>
                              <ion-label>{booking.user!.nickname}</ion-label>
                            </ion-item>
                            <ion-item>
                              <div slot="start">
                                <ion-icon name="call-outline"></ion-icon>
                                電話
                              </div>
                              <ion-label>{booking.user!.tel}</ion-label>
                            </ion-item>
                            <ion-item>
                              <div slot="start">
                                <ion-icon name="at-outline"></ion-icon>
                                電郵
                              </div>
                              <ion-label>{booking.user!.email}</ion-label>
                            </ion-item>
                            <ServiceTimeslotPicker
                              service={booking.service!}
                              datePicker={`datePicker${booking.id}`}
                              timeRadioGroup={`timeRadioGroup${booking.id}`}
                              bookingForm={`bookingForm${booking.id}`}
                              selectedTimeButton={`selectedTimeButton${booking.id}`}
                              onSelectDateFn={`onSelectDateFn${booking.id}`}
                            />
                            <ion-item>
                              <div slot="start">
                                <ion-icon name="hourglass-outline"></ion-icon>{' '}
                                時長
                              </div>
                              <ion-label>{formatDuration(service)}</ion-label>
                            </ion-item>
                          </ion-list>
                          <div class="ion-margin">
                            <ion-button
                              expand="block"
                              onclick={`confirmReschedule${booking.id}()`}
                            >
                              確認改期
                            </ion-button>
                          </div>
                        </form>
                        {Script(
                          /* javascript */ `
function initBookingForm${booking.id}() {
  let date = bookingForm${booking.id}.date
  let time = bookingForm${booking.id}.time
  if (!date || !time) {
    setTimeout(initBookingForm${booking.id},33)
    return
  }
  let d = new Date(${booking.appointment_time})
  let dateStr =
  [
    d.getFullYear(),
    d.getMonth() + 1,
    d.getDate()
  ]
  .map(x => x < 10 ? '0'+x : x)
  .join('-')
  let timeStr =
  [
    d.getHours(),
    d.getMinutes(),
  ].map(x => x < 10 ? '0'+x : x)
  .join(':')
  datePicker${booking.id}.value = dateStr
  let event = {
    detail: {
      value: dateStr
    }
  }
  onSelectDateFn${booking.id}(event)
  timeRadioGroup${booking.id}.value = timeStr
  selectedTimeButton${booking.id}.textContent = timeStr
}
initBookingForm${booking.id}()
function confirmReschedule${booking.id}() {
  let bookingForm = bookingForm${booking.id}
  if (!bookingForm.date.value) return showToast('請選擇日期', 'error')
  if (!bookingForm.time.value) return showToast('請選擇時間', 'error')
  let appointment_time = new Date(
    bookingForm.date.value.split('T')[0]
    + ' ' +
    bookingForm.time.value
  ).toISOString()
  let url = ${toRouteUrl(
    routes,
    '/shop/:shop_slug/booking/:booking_id/manage/:action',
    {
      params: { shop_slug, booking_id, action: 'reschedule' },
      search: attrs.search,
      json: true,
    },
  )}
  emit(url, appointment_time)
}
`,
                          'no-minify',
                        )}
                      </ion-content>
                    </ion-modal>
                  </>
                )
              })()
            : null}
          {attrs.can_reject ? (
            <IonButton
              color="dark"
              url={toRouteUrl(
                routes,
                '/shop/:shop_slug/booking/:booking_id/manage/:action',
                {
                  params: { shop_slug, booking_id, action: 'reject' },
                  search: attrs.search,
                },
              )}
            >
              取消
            </IonButton>
          ) : null}
        </div>
        <div class="ion-margin-horizontal">
          <Link
            tagName="ion-button"
            href={
              serviceUrl +
              '?tel=' +
              (booking.user!.tel?.replace('+852', '') || '')
            }
            class="ion-margin-bottom"
            expand="block"
          >
            {attrs.can_reschedule ? `查看${locale.service}詳情` : `再次預約`}
          </Link>
        </div>
      </div>
    </ion-card>
  )
}
export function ReceiptImageItem(
  shop_slug: string,
  service_slug: string,
  receipt_filename: string,
) {
  return (
    <div>
      <img
        src={`/assets/shops/${shop_slug}/${service_slug}/receipts/${receipt_filename}`}
        loading="lazy"
      />
    </div>
  )
}

function AdminPage(shop: Shop, context: DynamicContext) {
  let date = new URLSearchParams(context.routerMatch?.search).get('date')
  let page = AdminPageContent({ shop, date }, context)
  return (
    <>
      <ion-header id="BookingTabHeader">
        <ion-toolbar color="primary">
          <ion-title role="heading" aria-level="1">
            {date ? '預約行程曆' : '客戶的預約'}
          </ion-title>
          {topMenuButtons}
        </ion-toolbar>
        {calendarFilterItem}
        <ion-segment
          value="submitted"
          style="margin: 4px; width: calc(100% - 8px)"
        >
          {page.segmentButtons}
        </ion-segment>
      </ion-header>
      <ion-content id="BookingTabContent" class="ion-padding-horizontal">
        <div class="page-message">
          {page.service_count == 0 ? (
            <p class="ion-text-center">未有服務可接受預約</p>
          ) : null}
        </div>
        {Swiper({
          id: 'bookingSwiper',
          slides: page.segmentList.map(list => (
            <ion-list data-segment={list.segment}>{list.content}</ion-list>
          )),
        })}
      </ion-content>
      {loadClientPlugin({ entryFile: 'dist/client/sweetalert.js' }).node}
      {Script(page.script, 'no-minify')}
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

function AdminPageContent(
  attrs: { shop: Shop; date: string | null },
  context: Context,
) {
  let { shop, date } = attrs

  let search = date ? '?date=' + date : ''

  let service_count = count(proxy.service, { shop_id: shop.id! })

  let booking_ids =
    service_count > 0
      ? (select_booking_id_by_shop.all({
          shop_id: shop.id,
        }) as number[])
      : []
  let bookings = booking_ids.map(id => proxy.booking[id])

  let { submitted, confirmed, completed, cancelled, colors } =
    groupAppointments({ bookings, date })

  let segmentButtons = (
    <>
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
    </>
  )

  let segmentList = [
    {
      segment: 'submitted',
      content: (
        <>
          <p class="ion-margin-start">
            <span class="booking-count">{submitted.length}</span> 個未確認預約
          </p>
          {mapArray(submitted, booking =>
            BookingDetails({
              booking,
              timestamp: (
                <div>提交時間：{relative_timestamp(booking.submit_time)}</div>
              ),
              open_receipt: true,
              can_confirm: true,
              can_reschedule: true,
              can_reject: true,
              search,
            }),
          )}
        </>
      ),
    },
    {
      segment: 'confirmed',
      content: (
        <>
          <p class="ion-margin-start">
            <span class="booking-count">{confirmed.length}</span> 個未開始預約
          </p>
          {mapArray(confirmed, booking =>
            BookingDetails({
              booking,
              timestamp: (
                <div>
                  開始時間：{relative_timestamp(booking.appointment_time)}
                </div>
              ),
              can_arrive: true,
              can_reschedule: true,
              can_reject: true,
              search,
            }),
          )}{' '}
        </>
      ),
    },
    {
      segment: 'completed',
      content: (
        <>
          <p class="ion-margin-start">
            <span class="booking-count">{completed.length}</span> 個已完成預約
          </p>
          {mapArray(completed, booking =>
            BookingDetails({
              booking,
              timestamp: (
                <div>報到時間：{relative_timestamp(booking.arrive_time!)}</div>
              ),
              search,
            }),
          )}{' '}
        </>
      ),
    },
    {
      segment: 'cancelled',
      content: (
        <>
          <p class="ion-margin-start">
            <span class="booking-count">{cancelled.length}</span> 個已取消預約
          </p>
          {mapArray(cancelled, booking =>
            BookingDetails({
              booking,
              timestamp: (
                <div>
                  取消時間：
                  {relative_timestamp(
                    booking.cancel_time || booking.reject_time!,
                  )}
                </div>
              ),
              search,
            }),
          )}{' '}
        </>
      ),
    },
  ]

  let script = calendarScript({ appointment_dates: colors })

  function toUpdateMessages(): ServerMessage[] {
    return [
      [
        'update-in',
        '#BookingTabHeader ion-segment',
        nodeToVNode(segmentButtons, context),
      ],
      [
        'update-in',
        '#BookingTabContent .page-message',
        nodeToVNode(
          page.service_count == 0 ? (
            <p class="ion-text-center">未有服務可接受預約</p>
          ) : (
            <></>
          ),
          context,
        ),
      ],
      ...segmentList.map(
        (list): ServerMessage => [
          'update-in',
          `#bookingSwiper ion-list[data-segment="${list.segment}"]`,
          nodeToVNode(list.content, context),
        ],
      ),
      ['eval', script],
      ['eval', 'hideLoading()'],
    ]
  }

  return {
    segmentButtons,
    segmentList,
    service_count,
    script,
    toUpdateMessages,
  }
}

function UserPage(user: User | null, context: DynamicContext) {
  let date = new URLSearchParams(context.routerMatch?.search).get('date')
  let page = user ? UserPageContent({ user, date }, context) : null
  return (
    <>
      <ion-header id="BookingTabHeader">
        <ion-toolbar color="primary">
          <ion-title role="heading" aria-level="1">
            我的預約
          </ion-title>
          {topMenuButtons}
        </ion-toolbar>
        {calendarFilterItem}
        {page ? (
          <ion-segment
            value="submitted"
            style="margin: 4px; width: calc(100% - 8px)"
          >
            {page.segmentButtons}
          </ion-segment>
        ) : null}
      </ion-header>
      <ion-content id="BookingTabContent" class="ion-padding">
        {!page ? (
          <>
            <p>
              <Link href={loginRouteUrl(context)}>「登入」</Link>
              後可查看預約
            </p>
          </>
        ) : (
          <>
            <div class="page-message">
              {page.booking_count == 0 ? (
                <p class="ion-text-center">未有預約</p>
              ) : null}
            </div>
            {Swiper({
              id: 'bookingSwiper',
              slides: page.segmentList.map(list => (
                <ion-list data-segment={list.segment}>{list.content}</ion-list>
              )),
            })}
          </>
        )}
      </ion-content>
      {loadClientPlugin({ entryFile: 'dist/client/sweetalert.js' }).node}
      {page ? Script(page.script, 'no-minify') : null}
    </>
  )
}

function groupAppointments(options: {
  bookings: Booking[]
  date: string | null
}) {
  let { bookings, date } = options

  let submitted: Booking[] = []
  let confirmed: Booking[] = []
  let completed: Booking[] = []
  let cancelled: Booking[] = []

  let colors = new Map<string, DateColors>()

  let booking_count = bookings.length
  if (booking_count > 0) {
    for (let booking of bookings) {
      let appointment_date = formatHKDateString(booking.appointment_time)
      if (date && date != appointment_date) {
        continue
      }
      let color = colors.get(appointment_date)
      if (!color) {
        color = {}
        colors.set(appointment_date, color)
      }
      if (booking.cancel_time || booking.reject_time) {
        cancelled.push(booking)
        color.backgroundColor ||= cancelled_gray
      } else if (booking.arrive_time) {
        completed.push(booking)
        color.textColor ||= finished_green
      } else if (booking.approve_time) {
        confirmed.push(booking)
        color.textColor = confirmed_orange
      } else {
        submitted.push(booking)
        color.backgroundColor = submitted_pink
      }
    }
    let now = Date.now()
    submitted.sort((a, b) => b.submit_time - a.submit_time)
    confirmed.sort(
      (a, b) =>
        Math.abs(a.appointment_time - now) - Math.abs(b.appointment_time - now),
    )
    completed.sort((a, b) => b.arrive_time! - a.arrive_time!)
    cancelled.sort(
      (a, b) =>
        (b.reject_time || b.cancel_time)! - (a.reject_time || a.cancel_time)!,
    )
  }

  return {
    booking_count,
    submitted,
    confirmed,
    completed,
    cancelled,
    colors,
  }
}

let select_user_booking = db
  .prepare<
    {
      user_id: number
      shop_id: number
    },
    number
  >(
    /* sql */ `
select
  booking.id
from booking
inner join service on service.id = booking.service_id
where booking.user_id = :user_id
  and service.shop_id = :shop_id
`,
  )
  .pluck()

function UserPageContent(
  attrs: { user: User; date: string | null },
  context: DynamicContext,
) {
  let { user, date } = attrs
  let shop = getContextShop(context)

  let search = date ? '?date=' + date : ''

  let bookings = select_user_booking
    .all({
      user_id: user.id!,
      shop_id: shop.id!,
    })
    .map(id => proxy.booking[id])

  let { booking_count, submitted, confirmed, completed, cancelled, colors } =
    groupAppointments({ bookings, date })

  let segmentButtons = (
    <>
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
    </>
  )

  let segmentList = [
    {
      segment: 'submitted',
      content: (
        <>
          <p class="ion-margin-start">
            <span class="booking-count">{submitted.length}</span> 個未確認預約
          </p>
          {mapArray(submitted, booking =>
            BookingDetails({
              booking,
              timestamp: (
                <div>提交時間：{relative_timestamp(booking.submit_time)}</div>
              ),
              search,
            }),
          )}
        </>
      ),
    },
    {
      segment: 'confirmed',
      content: (
        <>
          <p class="ion-margin-start">
            <span class="booking-count">{confirmed.length}</span> 個未開始預約
          </p>
          {mapArray(confirmed, booking =>
            BookingDetails({
              booking,
              timestamp: (
                <div>
                  開始時間：{relative_timestamp(booking.appointment_time)}
                </div>
              ),
              search,
            }),
          )}{' '}
        </>
      ),
    },
    {
      segment: 'completed',
      content: (
        <>
          <p class="ion-margin-start">
            <span class="booking-count">{completed.length}</span> 個已完成預約
          </p>
          {mapArray(completed, booking =>
            BookingDetails({
              booking,
              timestamp: (
                <div>報到時間：{relative_timestamp(booking.arrive_time!)}</div>
              ),
              search,
            }),
          )}{' '}
        </>
      ),
    },
    {
      segment: 'cancelled',
      content: (
        <>
          <p class="ion-margin-start">
            <span class="booking-count">{cancelled.length}</span> 個已取消預約
          </p>
          {mapArray(cancelled, booking =>
            BookingDetails({
              booking,
              timestamp: (
                <div>
                  取消時間：
                  {relative_timestamp(
                    booking.cancel_time || booking.reject_time!,
                  )}
                </div>
              ),
              search,
            }),
          )}{' '}
        </>
      ),
    },
  ]

  let script = calendarScript({ appointment_dates: colors })

  function toUpdateMessages(): ServerMessage[] {
    return [
      [
        'update-in',
        '#BookingTabHeader ion-segment',
        nodeToVNode(segmentButtons, context),
      ],
      [
        'update-in',
        '#BookingTabContent .page-message',
        nodeToVNode(
          page.service_count == 0 ? (
            <p class="ion-text-center">未有服務可接受預約</p>
          ) : (
            <></>
          ),
          context,
        ),
      ],
      ...segmentList.map(
        (list): ServerMessage => [
          'update-in',
          `#bookingSwiper ion-list[data-segment="${list.segment}"]`,
          nodeToVNode(list.content, context),
        ],
      ),
      ['eval', script],
      ['eval', 'hideLoading()'],
    ]
  }

  return {
    segmentButtons,
    segmentList,
    booking_count,
    script,
    toUpdateMessages,
  }
}

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

function Calendar(attrs: {}, context: DynamicContext) {
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
    </>
  )
}

let filterParser = object({
  date: optional(dateString()),
})

function Filter(attrs: {}, context: WsContext) {
  try {
    let { shop, user, is_owner } = getAuthRole(context)

    let input = filterParser.parse({
      date: new URLSearchParams(context.routerMatch?.search).get('date'),
    })
    let date = input.date || null

    throw new MessageException([
      'batch',
      [
        [
          'update-text',
          'ion-title',
          input.date ? '預約行程曆' : is_owner ? '客戶的預約' : '我的預約',
        ],
        ...(is_owner
          ? AdminPageContent({ shop, date }, context).toUpdateMessages()
          : user
            ? UserPageContent({ user, date }, context).toUpdateMessages()
            : []),
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

let manageBookingParser = object({
  routerMatch: object({
    params: object({
      action: values([
        'approve' as const,
        'reschedule' as const,
        'arrive' as const,
        'reject' as const,
      ]),
      booking_id: id(),
    }),
  }),
  args: object({ 0: optional(date()) }),
})

function ManageBooking(attrs: {}, context: WsContext) {
  try {
    let { user, shop, is_owner } = getAuthRole(context)

    if (!user) throw `You must be logged in to manage booking`
    if (!is_owner) throw `You must be shop owner to manage booking`

    let input = manageBookingParser.parse(context)
    let { action, booking_id } = input.routerMatch.params
    let { 0: appointment_time } = input.args
    let date = new URLSearchParams(context.routerMatch?.search).get('date')

    let booking = proxy.booking[booking_id]
    if (!booking) throw 'Booking not found, id: ' + booking_id

    let service = booking.service!

    if (service.shop_id != shop.id)
      throw 'You cannot manage booking of another shop'

    let now = Date.now()

    switch (action) {
      case 'approve': {
        // TODO check quota
        booking.approve_time = now

        let service_url = toServiceUrl(service)

        sendEmail({
          from: env.EMAIL_USER,
          to: booking.user!.email!,
          cc: user.email!,
          subject: title(`${service!.name}預約確認`),
          html: /* html */ `
<p>
${booking.user!.nickname} 你好，
</p>
<p>
<b>${shop.name}</b>
確認了你在
<b>${formatDateTimeText({ time: booking.appointment_time }, context)}</b>
的
<b>${booking.service!.name}</b>
預約。
</p>
<p>
到時見！
</p>
<br>
<p>
按此查看詳情：<a href="${service_url}">${service_url}</a>
</p>
`,
          text: `${shop.name} 確認了在 ${formatDateTimeText({ time: booking.appointment_time }, context)} 的 ${booking.service!.name} 預約。到時見！！`,
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
            ...AdminPageContent({ shop, date }, context).toUpdateMessages(),
          ],
        ])
      }
      case 'reject': {
        booking.reject_time = now

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
</p>
<p>
<b>${shop.name}</b>
取消了原定在
<b>${formatDateTimeText({ time: booking.appointment_time }, context)}</b>
的
<b>${booking.service!.name}</b>
預約。
</p>
<p>
期待下次再見！
</p>
<br>
<p>
按此預約其他${locale.service}：<a href="${shop_url}">${shop_url}</a>
</p>
`,
          text: `${shop.name} 取消了原定在 ${formatDateTimeText({ time: booking.appointment_time }, context)} 的 ${booking.service!.name} 預約。期待下次再見！`,
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
            ...AdminPageContent({ shop, date }, context).toUpdateMessages(),
          ],
        ])
      }
      case 'reschedule': {
        if (!appointment_time) {
          throw 'missing appointment_time'
        }
        booking.appointment_time = appointment_time.getTime()

        let service_url = toServiceUrl(service)

        sendEmail({
          from: env.EMAIL_USER,
          to: booking.user!.email!,
          cc: user.email!,
          subject: title(`${service!.name}預約改期`),
          html: /* html */ `
<p>
${booking.user!.nickname} 你好，
</p>
<p>
<b>${shop.name}</b>
重新安排了你的
<b>${booking.service!.name}</b>
預約。
</p>
<p>
預約時間已改為
<b>${formatDateTimeText({ time: booking.appointment_time }, context)}</b>
。
</p>
到時見！
</p>
<br>
<p>
按此查看詳情：<a href="${service_url}">${service_url}</a>
</p>
`,
          text: `${shop.name} 重新安排了在 ${formatDateTimeText({ time: booking.appointment_time }, context)} 的 ${booking.service!.name} 預約。到時見！！`,
        }).catch(error => {
          context.ws.send([
            'eval',
            `showToast(${JSON.stringify('Failed to send email notice: ' + error)},'error');`,
          ])
        })

        throw new MessageException([
          'batch',
          [
            ['eval', `rescheduleModal${booking.id}.dismiss()`],
            [
              'eval',
              `showToast('重新安排了${booking.user!.nickname}的${booking.service!.name}預約','success')`,
            ],
            ...AdminPageContent({ shop, date }, context).toUpdateMessages(),
          ],
        ])
      }
      case 'arrive': {
        booking.arrive_time = now
        throw new MessageException([
          'batch',
          [
            [
              'eval',
              `showToast('報到了${booking.user!.nickname}的${booking.service!.name}預約','info')`,
            ],
            ...AdminPageContent({ shop, date }, context).toUpdateMessages(),
          ],
        ])
      }
      default:
        throw `Unsupported action: ${action}`
    }
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

let routes = {
  '/shop/:shop_slug/booking': {
    title: title(pageTitle),
    description: 'manage your service booking',
    menuFullNavigate: true,
    node: page,
  },
  '/shop/:shop_slug/booking/filter': {
    title: apiEndpointTitle,
    description: 'view all or filter by one date',
    node: <Filter />,
  },
  '/shop/:shop_slug/booking/:booking_id/manage/:action': {
    title: apiEndpointTitle,
    description: 'manage a booking by merchant',
    node: <ManageBooking />,
    streaming: false,
  },
} satisfies Routes

export default { routes }
