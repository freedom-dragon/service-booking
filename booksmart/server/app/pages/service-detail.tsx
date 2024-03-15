import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { apiEndpointTitle, config, title } from '../../config.js'
import Style from '../components/style.js'
import {
  Context,
  DynamicContext,
  ExpressContext,
  getContextFormBody,
} from '../context.js'
import { mapArray } from '../components/fragment.js'
import { IonBackButton } from '../components/ion-back-button.js'
import {
  date,
  dateString,
  email,
  id,
  int,
  literal,
  object,
  optional,
  string,
  timeString,
  values,
} from 'cast.ts'
import { Link, Redirect } from '../components/router.js'
import { renderError } from '../components/error.js'
import { getAuthUser } from '../auth/user.js'
import {
  Booking,
  Receipt,
  Service,
  ServiceTimeslot,
  TimeslotHour,
  User,
  proxy,
} from '../../../db/proxy.js'
import { count, del, filter, find } from 'better-sqlite3-proxy'
import {
  getServiceCoverImage,
  getServiceImages,
  getServiceOptionImage,
  getShopLocale,
  toDatePart,
} from '../shop-store.js'
import { Swiper } from '../components/swiper.js'
import { wsStatus } from '../components/ws-status.js'
import { Script } from '../components/script.js'
import { resolveServiceRoute } from '../shop-route.js'
import { concat_words } from '@beenotung/tslib/string.js'
import { to_full_hk_mobile_phone } from '@beenotung/tslib/validate.js'
import { loadClientPlugin } from '../../client-plugin.js'
import { Router } from 'express'
import { HttpError } from '../../http-error.js'
import { join } from 'path'
import { Formidable } from 'formidable'
import { mkdirSync, renameSync, unlinkSync } from 'fs'
import { EarlyTerminate, MessageException } from '../helpers.js'
import { nodeToVNode } from '../jsx/vnode.js'
import { client_config } from '../../../client/client-config.js'
import { TimezoneDate } from 'timezone-date.ts'
import { db } from '../../../db/db.js'
import { MINUTE } from '@beenotung/tslib/time.js'
import DateTimeText, { toLocaleDateTimeString } from '../components/datetime.js'
import { boolean } from 'cast.ts'
import { digits } from '@beenotung/tslib/random.js'
import { maskEmailForHint } from '../email-mask.js'
import { generatePasscode, verificationCodeEmail } from './verification-code.js'
import { sendEmail } from '../../email.js'
import { Raw } from '../components/raw.js'
import { randomUUID } from 'crypto'
import { Node } from '../jsx/types.js'
import { nodeToHTML } from '../jsx/html.js'

let pageTitle = 'Service Detail'
let addPageTitle = 'Add Service Detail'

let ServiceDetailStyle = Style(/* css */ `
#ServiceDetail {

}
.preview-image,
#ServiceImages {
  border-radius: 1rem;
  /*
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  */
}
#ServiceImages .swiper-slide img {
  width: 100vw;
  height: 100vw;
  object-fit: cover;
}
.swiper-pagination-images img {
  object-fit: cover;
}
.service-options ion-button {
  --ripple-color: transparent;
}
ion-item [slot="start"] {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
ion-item [slot="start"] ion-icon {
  width: 1.25rem;
  height: 1.25rem;
}
.remark--list h3 {
  font-size: 1rem;
}
.receipt--item {
  border: 1px solid black;
  border-radius: 1rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.receipt--item figcaption {
  display: flex;
  justify-content: space-between;
}
.receipt--status {
  flex-grow: 1;
  text-align: center;
  padding: 0.25rem;
}
`)

type ServiceTimeslotRow = Record<
  'id' | 'start_date' | 'end_date' | 'weekdays',
  string
>
let select_service_timeslot = db.prepare(/* sql */ `
select
  id
, start_date
, end_date
, weekdays
from service_timeslot
where service_id = :service_id
`)

type TimeslotHourRow = Record<'start_time' | 'end_time', string>
let select_timeslot_hour = db.prepare(/* sql */ `
select
  start_time
, end_time
from timeslot_hour
where service_timeslot_id = :service_timeslot_id
`)

function ServiceDetail(attrs: { service: Service }, context: DynamicContext) {
  let { service } = attrs
  let shop = service.shop!
  let shop_slug = shop!.slug
  let { slug: service_slug, desc } = service
  let address = service.address || shop.address
  let address_remark = service.address_remark || shop.address_remark
  let options = filter(proxy.service_option, { service_id: service.id! })
  let remarks = filter(proxy.service_remark, { service_id: service.id! })
  let locale = getShopLocale(shop.id!)
  let serviceUrl = `/shop/${shop_slug}/service/${service_slug}`
  let images = getServiceImages(shop_slug, service_slug)
  let user = getAuthUser(context)

  // address_remark = ''

  let booking =
    user &&
    find(proxy.booking, {
      user_id: user.id!,
      service_id: service.id!,
      cancel_time: null,
    })

  let allImages = [images.cover, ...images.more, ...images.options]
  let optionImageOffset = 1 + images.more.length

  let availableTimeslots = (
    select_service_timeslot.all({
      service_id: service.id,
    }) as ServiceTimeslotRow[]
  ).map(timeslot => {
    let hours = select_timeslot_hour.all({
      service_timeslot_id: timeslot.id,
    }) as TimeslotHourRow[]
    return { timeslot, hours }
  })

  let quota = service.quota

  return (
    <>
      {ServiceDetailStyle}
      <ion-header>
        <ion-toolbar color="primary">
          <IonBackButton
            href={'/shop/' + shop_slug}
            backText={'其他' + locale.service}
            color="light"
          />
          <ion-title>{locale.service}詳情</ion-title>
          <ion-buttons slot="end">
            <Link
              tagName="ion-button"
              title={'管理' + locale.service}
              href={`${serviceUrl}/admin`}
            >
              <ion-icon slot="icon-only" name="create"></ion-icon>
            </Link>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content id="ServiceDetail" color="light">
        <h1 class="ion-margin">{service.name}</h1>
        <div class="ion-margin-horizontal">
          <Swiper
            id="ServiceImages"
            images={allImages.map(url => (
              <img src={url} />
            ))}
            showPagination
            showArrow
          />
        </div>

        <form
          id="bookingForm"
          action={`${serviceUrl}/booking/submit`}
          method="POST"
        >
          <ion-list lines="full" inset="true">
            <ion-item lines="none">
              <div slot="start">
                <ion-icon name="options-outline"></ion-icon> 款式
              </div>
            </ion-item>
            <ion-item>
              <div
                class="service-options ion-margin-horizontal flex-wrap"
                style="gap: 0.25rem; margin-bottom: 8px"
              >
                <input hidden name="option_id" />
                {mapArray(options, (option, index) => (
                  <ion-button
                    size="small"
                    fill={options.length == 1 ? 'solid' : 'outline'}
                    onclick="selectOption(this)"
                    data-id={option.id}
                    data-index={index + optionImageOffset}
                  >
                    {option.name}
                  </ion-button>
                ))}
              </div>
            </ion-item>
            {Script(/* javascript */ `
function selectOption(button){
  bookingForm.option_id.value = button.dataset.id
  swiperSlide(ServiceImages, button.dataset.index);
  if (button.fill == 'solid') return
  let buttons = button.parentElement.children
  for (let each of buttons) {
    each.fill = each == button ? 'solid' : 'outline';
  }
}
`)}
            <ion-item>
              <div slot="start">
                <ion-icon name="people-outline"></ion-icon> 人數
              </div>
              <ion-input
                placeholder="1"
                type="number"
                min="1"
                max={quota}
                name="amount"
                /* TODO avoid overbook */
                oninput={
                  `this.value>${quota}&&(this.value=${quota});` +
                  (+service.unit_price!
                    ? `priceLabel.textContent='$'+${service.unit_price}*(this.value||1)+'/'+this.value+'${service.price_unit}';`
                    : '')
                }
              />
              <ion-label slot="end">{service.price_unit}</ion-label>
              <div slot="helper">
                上限: {quota} {service.price_unit}
              </div>
            </ion-item>
            <ion-item>
              <div slot="start">
                <ion-icon name="hourglass-outline"></ion-icon> 時長
              </div>
              <ion-label>{service.hours}</ion-label>
            </ion-item>
            <input name="appointment_time" hidden />
            <ion-item>
              <div slot="start">
                <ion-icon name="calendar-outline"></ion-icon> 日期
              </div>
              <ion-datetime-button datetime="datePicker"></ion-datetime-button>
              <ion-modal>
                <ion-datetime
                  id="datePicker"
                  presentation="date"
                  show-default-buttons="true"
                  name="date"
                >
                  <span slot="title">預約日期</span>
                </ion-datetime>
              </ion-modal>
            </ion-item>
            {Script(/* javascript */ `
    var availableTimeslots = ${JSON.stringify(availableTimeslots)};
    var book_duration_ms = ${service.book_duration_minute * MINUTE};
    var book_time_step_ms = ${15 * MINUTE};
    datePicker.isDateEnabled = (${function (
      timeslots: typeof availableTimeslots,
    ) {
      return function isDateEnabled(dateString: string) {
        let date = new Date(dateString)
        let today = new Date()
        today.setHours(0, 0, 0, 0)
        if (date.getTime() < today.getTime()) {
          return false
        }
        let day = date.getDay()
        for (let { timeslot, hours } of timeslots) {
          if (
            timeslot.start_date <= dateString &&
            dateString <= timeslot.end_date
          ) {
            let canSelect = '日一二三四五六'
              .split('')
              .some(
                (weekday, i) => timeslot.weekdays.includes(weekday) && day == i,
              )
            if (canSelect) return true
          }
        }
      }
    }})(availableTimeslots);
    datePicker.addEventListener('ionChange', (${function (
      timeslots: typeof availableTimeslots,
      book_duration_ms: number,
      book_time_step_ms: number,
    ) {
      return function onDateSelected(event: any) {
        let dateString = event.detail.value as string
        dateString = dateString.split('T')[0]
        let date = new Date(dateString)
        let day = date.getDay()
        let isTimeAllowed = false
        for (let { timeslot, hours } of timeslots) {
          if (
            timeslot.start_date <= dateString &&
            dateString <= timeslot.end_date
          ) {
            let canSelect = '日一二三四五六'
              .split('')
              .some(
                (weekday, i) => timeslot.weekdays.includes(weekday) && day == i,
              )
            if (canSelect) {
              timeRadioGroup
                .querySelectorAll('ion-item')
                .forEach(e => e.remove())
              for (let hour of hours) {
                let [h, m] = hour.start_time.split(':')
                let start = new Date()
                start.setHours(+h, +m, 0, 0)

                let d2 = (x: number) => (x < 10 ? '0' + x : x)

                for (;;) {
                  let start_time =
                    d2(start.getHours()) + ':' + d2(start.getMinutes())

                  let end = new Date(start.getTime() + book_duration_ms)
                  let end_time = d2(end.getHours()) + ':' + d2(end.getMinutes())

                  if (end_time > hour.end_time) break

                  let item = document.createElement('ion-item')
                  let radio = document.createElement(
                    'ion-radio',
                  ) as HTMLInputElement
                  radio.value = start_time
                  if (start_time == bookingForm.time.value) {
                    isTimeAllowed = true
                  }
                  radio.textContent = start_time + ' - ' + end_time
                  item.appendChild(radio)
                  timeRadioGroup.appendChild(item)

                  start.setTime(start.getTime() + book_time_step_ms)
                }
              }
            }
          }
        }
        if (!isTimeAllowed) {
          bookingForm.time.value = ''
          selectedTimeButton.textContent = '未選擇'
        }
      }
    }})(availableTimeslots, book_duration_ms, book_time_step_ms))
    `)}
            <ion-accordion-group>
              <ion-accordion value="address">
                <ion-item slot="header">
                  <div slot="start">
                    <ion-icon name="time-outline"></ion-icon> 時間
                    <ion-button
                      id="selectedTimeButton"
                      color="light"
                      class="ion-padding-horizontal"
                    >
                      未選擇
                    </ion-button>
                  </div>
                </ion-item>
                <div class="ion-padding-horizontal" slot="content">
                  <ion-radio-group
                    id="timeRadioGroup"
                    allow-empty-selection="true"
                    name="time"
                  >
                    <ion-item>
                      <ion-radio value="">請先選擇日期</ion-radio>
                    </ion-item>
                  </ion-radio-group>
                </div>
              </ion-accordion>
            </ion-accordion-group>
            {Script(/* javascript */ `
timeRadioGroup.addEventListener('ionChange', event => {
  selectedTimeButton.textContent = event.detail.value || '未選擇'
})
`)}
            <ion-item-divider style="min-height:2px"></ion-item-divider>
            {/*
            For guest: ask tel
              if tel in DB, ask email and auth code
              if tel is new, ask name, email and auth code
            For user: show name, tel, email
            */}
            {!user ? (
              <>
                <ion-item>
                  <div slot="start">
                    <ion-icon name="call-outline"></ion-icon> 電話
                  </div>
                  <ion-input
                    type="tel"
                    name="tel"
                    minlength="8"
                    maxlength="8"
                    oninput="this.value.length == 8 && emit('/check-tel', this.value)"
                  />
                </ion-item>
                <div id="guestInfo"></div>
              </>
            ) : (
              <>
                <ion-item>
                  <div slot="start">
                    <ion-icon name="happy-outline"></ion-icon> 名稱
                  </div>
                  <ion-input name="nickname" value={user.nickname} />
                </ion-item>
                <ion-item>
                  <div slot="start">
                    <ion-icon name="call-outline"></ion-icon> 電話
                  </div>
                  <ion-input type="tel" name="tel" readonly value={user.tel} />
                </ion-item>
                <ion-item>
                  <div slot="start">
                    <ion-icon name="at-outline"></ion-icon> 電郵
                  </div>
                  <ion-input type="email" name="email" value={user.email} />
                </ion-item>
              </>
            )}
          </ion-list>

          {desc || address ? (
            <>
              <h2 class="ion-margin">活動詳情</h2>
              <ion-list lines="full" inset="true">
                {desc ? (
                  <ion-item>
                    <p style="white-space: pre-wrap">{desc}</p>
                  </ion-item>
                ) : null}
                {!address ? null : address_remark ? (
                  <ion-accordion-group>
                    <ion-accordion value="address">
                      <ion-item slot="header">
                        <div slot="start" style="margin-inline: 0 0.5rem">
                          <ion-icon name="map-outline"></ion-icon> 地址
                        </div>
                        <ion-label>{address}</ion-label>
                      </ion-item>
                      <div class="ion-padding" slot="content">
                        <p style="white-space: pre-wrap">{address_remark}</p>
                        <ion-button
                          fill="block"
                          color="primary"
                          href={
                            'https://www.google.com/maps/search/' +
                            encodeURIComponent(address)
                          }
                          target="_blank"
                        >
                          <ion-icon name="map-outline" slot="start"></ion-icon>
                          View on Map
                        </ion-button>
                      </div>
                    </ion-accordion>
                  </ion-accordion-group>
                ) : (
                  <ion-item
                    href={
                      'https://www.google.com/maps/search/' +
                      encodeURIComponent(address)
                    }
                    target="_blank"
                  >
                    <div slot="start">
                      <ion-icon name="map-outline"></ion-icon> 地址
                    </div>
                    <ion-label>{address}</ion-label>
                  </ion-item>
                )}
              </ion-list>
            </>
          ) : null}

          {remarks.length > 0 ? (
            <>
              <h2 class="ion-margin">注意事項</h2>
              <ion-list lines="full" inset="true" class="remark--list">
                {mapArray(remarks, remark => (
                  <ion-item>
                    <div>
                      <h3>{remark.title}</h3>
                      <p>{remark.content}</p>
                    </div>
                  </ion-item>
                ))}
              </ion-list>
            </>
          ) : null}
        </form>

        {/* {wsStatus.safeArea} */}
      </ion-content>
      <ion-footer style="background-color: var(--ion-color-light);">
        <ion-list inset="true" style="margin-top: 0.5rem">
          <ion-item>
            <ion-label>
              費用{' '}
              <span id="priceLabel">
                {+service.unit_price!
                  ? '$' + service.unit_price + '/' + service.price_unit
                  : service.unit_price}
              </span>
            </ion-label>
            <ion-button
              size="normal"
              color="primary"
              slot="end"
              class="ion-padding-horizontal"
              style="--ion-padding: 2rem;"
              onclick="submitBooking()"
            >
              立即預約
            </ion-button>
          </ion-item>
        </ion-list>
      </ion-footer>
      <ion-modal id="submitModal">
        {booking ? (
          <>
            <PaymentModal booking={booking} />
            {context.type == 'ws'
              ? Script(/* javascript */ `
function showSubmitModal() {
  if (submitModal.present) {
    submitModal.present()
  } else {
    setTimeout(showSubmitModal, 50)
  }
}
setTimeout(showSubmitModal, 50)
`)
              : null}
          </>
        ) : null}
      </ion-modal>
      {ServiceDetailScripts}
    </>
  )
}
let ServiceDetailScripts = (
  <>
    {loadClientPlugin({ entryFile: 'dist/client/sweetalert.js' }).node}
    {
      loadClientPlugin({
        entryFile: 'dist/client/image.js',
      }).node
    }
    {Script(/* javascript */ `
function submitBooking() {
  if (!bookingForm.option_id.value) return showToast('請選擇款式', 'error')
  if (!bookingForm.amount.value) bookingForm.amount.value = 1
  if (!bookingForm.date.value) return showToast('請選擇日期', 'error')
  if (!bookingForm.time.value) return showToast('請選擇時間', 'error')
  if (!bookingForm.tel.value) return showToast('請提供電話號碼', 'error')
  bookingForm.appointment_time.value = new Date(
    bookingForm.date.value.split('T')[0]
    + ' ' +
    bookingForm.time.value
  ).toISOString()
  submitForm(bookingForm)
}
async function uploadReceipt(url) {
  let images = await selectReceiptImages()
  let formData = new FormData()
  for (let image of images) {
    formData.append('file', image.file)
  }
  let res = await fetch(url, {
    method: 'POST',
    body: formData,
  })
  let json = await res.json()
  if (json.error) {
    showToast(json.error, 'error')
    return
  }
  if (json.fragment) {
    let fragment = document.createRange().createContextualFragment(json.fragment)
    receiptImageList.appendChild(fragment)
    let buttons = submitModal.querySelector('ion-header ion-buttons')
    buttons.innerHTML = 
    '<ion-button onclick="submitModal.dismiss()">返回</ion-button>'
  }
}
`)}
  </>
)

function PaymentModal(attrs: { booking: Booking }, context: Context) {
  let { booking } = attrs
  let service = booking.service!
  let service_slug = service.slug
  let shop = service.shop!
  let shop_slug = shop.slug
  let serviceUrl = `/shop/${shop_slug}/service/${service_slug}`
  let receipts = filter(proxy.receipt, { booking_id: booking.id! })
  return (
    <>
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            {receipts.length == 0 ? (
              <ion-button
                onclick={`emit('${serviceUrl}/booking/${booking.id}/cancel')`}
                color="danger"
              >
                取消預約
              </ion-button>
            ) : (
              <ion-button onclick="submitModal.dismiss()">返回</ion-button>
            )}
          </ion-buttons>
          <ion-title>確認付款</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <h1>預約選項</h1>
        <div>{service.name}</div>
        <div>
          ({booking.amount} {service.price_unit})
        </div>
        <div>款式: {booking.service_option?.name}</div>
        <div>
          預約日期:{' '}
          {toLocaleDateTimeString(booking.appointment_time, context, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </div>
        <div>
          預約時間:{' '}
          {toLocaleDateTimeString(booking.appointment_time, context, {
            hour: '2-digit',
            hour12: false,
            minute: '2-digit',
          })}
        </div>
        <div>時長: {service.hours}</div>
        <h1>總共費用</h1>
        <div id="totalPriceLabel"></div>
        <div>${(booking.amount * service.unit_price).toLocaleString()}</div>
        <h1>付款方法</h1>
        <ion-item>
          <ion-thumbnail slot="start">
            <img src="/assets/payment-methods/payme.webp" />
          </ion-thumbnail>
          <ion-label>Payme / 98765432</ion-label>
        </ion-item>
        <div class="ion-margin">
          <ion-button
            fill="block"
            color="primary"
            onclick={`uploadReceipt('${serviceUrl}/receipt?booking_id=${booking.id}')`}
          >
            <ion-icon name="cloud-upload" slot="start"></ion-icon>
            上傳付款證明
          </ion-button>
        </div>
        <div id="receiptImageList">
          {mapArray(receipts, receipt => ReceiptFigure({ receipt }, context))}
        </div>
      </ion-content>
    </>
  )
}
function ReceiptFigure(
  attrs: {
    receipt: Receipt
  },
  context: Context,
) {
  let { receipt } = attrs
  let service = receipt.booking!.service!
  let service_slug = service.slug
  let shop_slug = service.shop!.slug
  let serviceUrl = `/shop/${shop_slug}/service/${service_slug}`
  return (
    <figure class="receipt--item" data-receipt-id={receipt.id}>
      <img
        src={
          `/assets/shops/${shop_slug}/${service_slug}/receipts/${receipt.filename}`
          // "https://picsum.photos/seed/600/600"
        }
      />
      <figcaption>
        <span class="receipt--status">
          上載於{' '}
          {toLocaleDateTimeString(receipt.upload_time, context, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',

            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        <ion-buttons>
          <ion-button
            color="danger"
            title="刪除收據相片"
            onclick={`emit('${serviceUrl}/receipt/${receipt.id}/delete')`}
          >
            <ion-icon name="trash" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </figcaption>
    </figure>
  )
}

let ManageServiceStyle = Style(/* css */ `
#ManageService h2,
#ManageService h3 {
  align-items: center;
}
#ManageService h3 {
  font-size: 1.1rem;
  margin-top: 0.5rem;
  margin-bottom: 0.25rem;
}
#ManageService .service-option img {
  margin: 0 1rem 0.5rem;
  margin-bottom: 0;
  width: calc(100vw - 64px);
  height: calc(100vw - 64px);
  border-radius: 0.25rem;
}
#ManageService ion-item-divider {
  margin: 0 1rem;
  width: calc(100% - 2rem);
  min-height: 8px;
}
#ManageService ion-item-divider.list-description {
  padding: 0.5rem 0;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
#ManageService ion-item-divider.list-description p {
  width: 100%;
  text-align: center;
  color: var(--ion-color-dark);
}
#ManageService .weekday--list {
  justify-content: space-around;
  margin-top: 0;
}
#ManageService .weekday--item {
  align-items: center;
  gap: 0.5rem;
}
#ManageService .time-picker--container {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
`)
let ManageServiceScripts = (
  <>
    {loadClientPlugin({ entryFile: 'dist/client/image.js' }).node}
    {loadClientPlugin({ entryFile: 'dist/client/sweetalert.js' }).node}
    {Script(/* javascript */ `
function chooseWeekdays(button, weekdays) {
  let item = button.closest('.available-timeslot--item')
  let list = item.querySelector('.weekday--list')
  for (let i of weekdays) {
    let checkbox = list.children[i].querySelector('ion-checkbox')
    checkbox.checked = !checkbox.checked
  }
  saveWeekdays(button)
}
function saveWeekdays(target) {
  let item = target.closest('.available-timeslot--item')
  let weekdays = ''
  for (let checkbox of item.querySelectorAll('ion-checkbox[name="weekday"]')) {
    if (checkbox.checked) {
      weekdays += checkbox.value
    }
  }
  let timeslot_id = item.dataset.timeslotId
  let url = item.dataset.updateUrl
  emit(url, 'weekdays', weekdays)
}
window.addEventListener('ionChange', event => {
  if (!event.target.matches('.available-timeslot--item ion-checkbox[name="weekday"]'))
    return
  event.stopImmediatePropagation()
  saveWeekdays(event.target)
})
async function editCoverImage() {
  let image = await selectServiceImage()
  if (!image) return
  coverImage.src = image.dataUrl
  coverImage.file = image.file
  uploadCoverImageButton.hidden = false
  uploadCoverImageButton.querySelector('.button-text').textContent = 'Upload'
  uploadCoverImageButton.color = 'dark'
  uploadCoverImageButton.disabled = false
}
async function editOptionImage(editButton) {
  let serviceOption = editButton.closest('.service-option')
  let previewImage = serviceOption.querySelector('.preview-image')
  let uploadButton = serviceOption.querySelector('.upload-button')
  let image = await selectServiceImage()
  if (!image) return
  previewImage.src = image.dataUrl
  previewImage.file = image.file
  uploadButton.hidden = false
  uploadButton.querySelector('.button-text').textContent = 'Upload'
  uploadButton.color = 'dark'
  uploadButton.disabled = false
}
async function uploadCoverImage() {
  uploadImage(uploadCoverImageButton, coverImage.file)
}
async function uploadOptionImage(button) {
  let serviceOption = button.closest('.service-option')
  let previewImage = serviceOption.querySelector('.preview-image')
  uploadImage(button, previewImage.file)

}
async function uploadImage(button, file) {
  if (!file) return
  let formData = new FormData()
  formData.set('file', file)
  let url = button.dataset.url
  let res = await fetch(url, {
    method: 'POST',
    body: formData
  })
  let json = await res.json()
  console.log('upload result:', json)
  if (json.error) {
    showAlert(json.error, 'error')
    return
  }
  button.querySelector('.button-text').textContent = 'Uploaded'
  button.color = 'success'
  button.disabled = true
}
function saveOptionName(button) {
  let item = button.closest('ion-item')
  let input = item.querySelector('ion-input')
  let url = button.dataset.url
  let id = button.dataset.id
  let value = input.value
  emit(url,id,value)
}
`)}
  </>
)
function ManageService(attrs: { service: Service }, context: DynamicContext) {
  let { service } = attrs
  let shop = service.shop!
  let shop_slug = shop!.slug
  let { slug: service_slug } = service
  let address = service.address || shop.address
  let options = filter(proxy.service_option, { service_id: service.id! })
  let locale = getShopLocale(shop.id!)
  let serviceUrl = `/shop/${shop_slug}/service/${service_slug}`
  let dateRange = getDateRange()
  let service_timeslot_rows = filter(proxy.service_timeslot, {
    service_id: service.id!,
  })
  let unit_price = (() => {
    let str = service.unit_price
    let val = +str!
    if (val == 0 || val) {
      return '$' + val
    }
    return str
  })()
  return (
    <>
      {ServiceDetailStyle}
      {ManageServiceStyle}
      <ion-header>
        <ion-toolbar color="primary">
          <IonBackButton href={serviceUrl} color="light" />
          <ion-title role="heading" aria-level="1">
            {concat_words('管理', service.name)}
          </ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content id="ManageService" color="light">
        <h2 class="ion-margin">{locale.service}資料</h2>
        <ion-list
          lines="full"
          inset="true"
          style="margin-bottom: 0.5rem; padding-bottom: 0.5rem;"
        >
          <ion-item>
            <div slot="start">
              <ion-icon name="people-outline"></ion-icon> 標題
            </div>
            <ion-input
              placeholder="輸入一個簡短的標題"
              value={service.name}
              onchange={`emit('${serviceUrl}/update','name',this.value)`}
            />
          </ion-item>
          <ion-item>
            <div slot="start">
              <ion-icon name="cash-outline"></ion-icon> 費用
            </div>
            <div class="d-flex" style="align-items: center; gap: 0.25rem">
              <ion-input
                value={unit_price}
                placeholder="單價"
                type="text"
                onchange={`emit('${serviceUrl}/update','unit_price',this.value)`}
              />
              <span>/</span>
              <ion-input
                value={service.price_unit}
                placeholder="單位"
                onchange={`emit('${serviceUrl}/update','price_unit',this.value)`}
              />
            </div>
            <div slot="helper">
              如: $100/人 、 $150/對情侶 、 📐 量身訂做/位
            </div>
          </ion-item>
          <ion-item>
            <div slot="start">
              <ion-icon name="people-outline"></ion-icon> 人數
            </div>
            <div class="d-flex" style="align-items: center; gap: 0.25rem">
              <ion-input
                value={service.quota}
                placeholder="上限"
                type="number"
                min="1"
                onchange={`emit('${serviceUrl}/update','quota',this.value)`}
              />
            </div>
            <div slot="helper">如: 6(人) / 2(對情侶)</div>
          </ion-item>
          <ion-item>
            <div slot="start">
              <ion-icon name="hourglass-outline"></ion-icon> 時長 (顯示)
            </div>
            <ion-input
              value={service.hours}
              placeholder="如: 2.5 - 3 小時"
              onchange={`emit('${serviceUrl}/update','hours',this.value)`}
            />
            <div slot="helper">作顯示用途。可以是範圍，如: 2.5 - 3 小時</div>
          </ion-item>
          <ion-item>
            <div slot="start">
              <ion-icon name="hourglass-outline"></ion-icon> 時長 (計算)
            </div>
            <div slot="end">分鐘</div>
            <ion-input
              value={service.book_duration_minute}
              placeholder="如: 120"
              onchange={`emit('${serviceUrl}/update','book_duration_minute',this.value)`}
              type="number"
              min="1"
            />
            <div slot="helper">
              系統會以這個分鐘數作為計算。建議輸入每節最長時間。
            </div>
          </ion-item>
          <ion-item>
            <div slot="start">
              <ion-icon name="map-outline"></ion-icon> 地址 (街道)
            </div>
            <ion-input
              value={service.address}
              placeholder={shop.address}
              onchange={`emit('${serviceUrl}/update','address',this.value)`}
            />
            {address ? (
              <div
                slot="helper"
                style1="display: flex; align-items: center; gap: 1rem"
                class="w-100"
              >
                預覽
                <ion-button
                  fill="block"
                  color="primary"
                  size="normal"
                  href={
                    'https://www.google.com/maps/search/' +
                    encodeURIComponent(address)
                  }
                  target="_blank"
                >
                  <ion-icon name="map-outline" slot="start"></ion-icon>
                  View on Map
                </ion-button>
              </div>
            ) : null}
          </ion-item>
          {address ? (
            <ion-item-divider
              style="
                min-height:2px;
                margin:0.25rem 0;
                width:100%;
              "
            ></ion-item-divider>
          ) : null}
          <ion-item>
            <div>
              <ion-icon name="map-outline"></ion-icon> 地址 (備註)
              <div>
                <ion-textarea
                  value={service.address_remark}
                  placeholder={shop.address_remark}
                  auto-grow
                  onchange={`emit('${serviceUrl}/update','address_remark',this.value)`}
                />
              </div>
            </div>
          </ion-item>
        </ion-list>

        <h2 class="ion-margin">可預約時段</h2>
        <ion-list
          lines="full"
          inset="true"
          style="margin-bottom: 0.5rem; padding-bottom: 0.5rem;"
          class="available-timeslot--list"
        >
          {mapArray(
            service_timeslot_rows,
            (service_timeslot, timeslot_index) => {
              return TimeslotItem({
                service_timeslot,
                is_first_slot: timeslot_index == 0,
                dateRange,
                serviceUrl,
              })
            },
          )}
          <ion-item-divider class="list-description" color="light">
            <p>
              {service_timeslot_rows.length > 0
                ? `共 ${service_timeslot_rows.length} 組時段`
                : `未有任何時段`}
            </p>
          </ion-item-divider>
          <div class="text-center">
            <ion-button onclick={`emit('${serviceUrl}/timeslot/add')`}>
              <ion-icon name="add" slot="start"></ion-icon>
              加時段
            </ion-button>
          </div>
        </ion-list>

        <h2 class="ion-margin d-flex">
          封面相
          <ion-buttons style="display: inline-flex">
            <ion-button onclick="editCoverImage()">
              <ion-icon name="create" slot="icon-only" />
            </ion-button>
          </ion-buttons>
        </h2>
        <img
          src={getServiceCoverImage(shop_slug, service_slug)}
          id="coverImage"
          class="preview-image"
          style="
      margin: 0 1rem;
      border-radius: 0.5rem;
      width: calc(100vw - 2rem);
      height: calc(100vw - 2rem);
    "
        />
        <div class="text-center">
          <ion-button
            hidden
            id="uploadCoverImageButton"
            onclick="uploadCoverImage(this)"
            data-url={serviceUrl + '/image?name=cover'}
          >
            <ion-icon name="cloud-upload" slot="start"></ion-icon>
            <span class="button-text">Upload</span>
          </ion-button>
        </div>

        <h2 class="ion-margin">款式</h2>
        <ion-list inset="true" class="service-option-list">
          {mapArray(options, (option, i) => (
            <div class="service-option">
              {i > 0 ? <ion-item-divider></ion-item-divider> : null}
              <ion-item>
                <ion-input
                  label={'款式 ' + (i + 1) + ' 標題'}
                  value={option.name}
                />
                <ion-buttons slot="end">
                  <ion-button
                    color="success"
                    onclick="saveOptionName(this)"
                    data-url={serviceUrl + '/option/name'}
                    data-id={option.id}
                  >
                    <ion-icon name="save" />
                  </ion-button>
                  <ion-button color="danger">
                    <ion-icon name="trash" />
                  </ion-button>
                </ion-buttons>
              </ion-item>
              <h3 class="ion-margin-horizontal d-flex">
                款式 {i + 1} 相片
                <ion-buttons style="display: inline-flex">
                  <ion-button onclick="editOptionImage(this)" color="primary">
                    <ion-icon name="create" slot="icon-only" />
                  </ion-button>
                </ion-buttons>
              </h3>
              <img
                src={getServiceOptionImage(shop_slug, service_slug, option.id!)}
                class="preview-image"
              />
              <div class="text-center">
                <ion-button
                  hidden
                  onclick="uploadOptionImage(this)"
                  data-url={serviceUrl + '/image?name=option&id=' + option.id}
                  class="upload-button"
                >
                  <ion-icon name="cloud-upload" slot="start"></ion-icon>
                  <span class="button-text">Upload</span>
                </ion-button>
              </div>
            </div>
          ))}
          <ion-item-divider class="list-description" color="light">
            <p>
              {options.length > 0 ? `共 ${options.length} 款` : `未有任何款式`}
            </p>
          </ion-item-divider>
          <div class="text-center">
            <ion-button onclick="addOption()">
              <ion-icon name="cloud-upload" slot="start"></ion-icon>
              加款式
            </ion-button>
          </div>
        </ion-list>

        {wsStatus.safeArea}
      </ion-content>
      {ManageServiceScripts}
    </>
  )
}

function TimeslotItem(attrs: {
  service_timeslot: ServiceTimeslot
  is_first_slot: boolean
  dateRange: { min: string; max: string }
  serviceUrl: string
}) {
  let { service_timeslot, is_first_slot, dateRange, serviceUrl } = attrs
  let { weekdays } = service_timeslot
  let timeslot_id = service_timeslot.id!

  let hours = filter(proxy.timeslot_hour, {
    service_timeslot_id: timeslot_id,
  })

  let startDatePickerId = 'startDatePicker_' + timeslot_id
  let endDatePickerId = 'endDatePicker_' + timeslot_id

  return (
    <div
      class="available-timeslot--item"
      data-timeslot-id={service_timeslot.id}
      data-update-url={`${serviceUrl}/timeslot/${timeslot_id}/update`}
      method="POST"
    >
      {is_first_slot ? null : <ion-item-divider></ion-item-divider>}
      <ion-item>
        <ion-label>可預約時段</ion-label>
        <ion-buttons slot="end">
          <ion-button
            size="small"
            color="danger"
            onclick={`emit('${serviceUrl}/timeslot/${timeslot_id}/remove')`}
          >
            <ion-icon name="trash" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-item>
      <ion-item>
        <ion-label>開始日期</ion-label>
        <ion-datetime-button datetime={startDatePickerId} />
        <ion-modal>
          <ion-datetime
            id={startDatePickerId}
            value={service_timeslot.start_date}
            presentation="date"
            show-default-buttons="true"
            min={dateRange.min}
            max={dateRange.max}
          />
        </ion-modal>
      </ion-item>
      <ion-item>
        <ion-label>結束日期</ion-label>
        <ion-datetime-button datetime={endDatePickerId} />
        <ion-modal>
          <ion-datetime
            id={endDatePickerId}
            value={service_timeslot.end_date}
            presentation="date"
            show-default-buttons="true"
            min={dateRange.min}
            max={dateRange.max}
          />
        </ion-modal>
      </ion-item>
      {Script(
        /* javascript */ `
${startDatePickerId}.addEventListener('ionChange', event => {
  let value = event.detail.value;
  emit('${serviceUrl}/timeslot/${timeslot_id}/update','start_date',value);
});
${endDatePickerId}.addEventListener('ionChange', event => {
  let value = event.detail.value;
  emit('${serviceUrl}/timeslot/${timeslot_id}/update','end_date',value)
});
`,
        'no-minify',
      )}
      <ion-item lines="none">
        <ion-label>可選擇星期</ion-label>
      </ion-item>
      <ion-item lines="none">
        <div slot="start" style="color: var(--ion-color-medium)">
          快捷選項
        </div>
        <div slot="end">
          <ion-button onclick="chooseWeekdays(this,[1,2,3,4,5])">
            星期一至五
          </ion-button>
          <ion-button onclick="chooseWeekdays(this,[0,6])">星期六日</ion-button>
        </div>
      </ion-item>
      <ion-item lines="none">
        <div slot="start" style="color: var(--ion-color-medium)">
          自選組合
        </div>
      </ion-item>
      <div class="ion-margin d-flex weekday--list">
        {mapArray('日一二三四五六'.split(''), weekday => (
          <div class="flex-column weekday--item">
            <ion-label>{weekday}</ion-label>
            <ion-checkbox
              data-timeslot-id={timeslot_id}
              name="weekday"
              value={weekday}
              checked={weekdays.includes(weekday)}
            ></ion-checkbox>
          </div>
        ))}
      </div>
      <ion-item lines="none">
        <ion-label>可選擇時間</ion-label>
      </ion-item>
      <div class="time-picker--list" data-timeslot-id={timeslot_id}>
        {mapArray(hours, hour =>
          TimePickerListItem({
            serviceUrl,
            timeslot_id,
            hour,
          }),
        )}
      </div>
      <div class="ion-text-center">
        <ion-button
          onclick={`emit('${serviceUrl}/timeslot/${timeslot_id}/hour','add')`}
        >
          <ion-icon name="add" slot="start"></ion-icon>
          加時間
        </ion-button>
      </div>
    </div>
  )
}

function TimePickerListItem(attrs: {
  serviceUrl: string
  timeslot_id: number
  hour: TimeslotHour
}) {
  let { serviceUrl, timeslot_id, hour } = attrs
  let hour_id = hour.id!
  let startTimePickerId = 'startTimePicker_' + hour_id
  let endTimePickerId = 'endTimePicker_' + hour_id
  return (
    <ion-item lines="none" data-timeslot-hour-id={hour.id}>
      <div slot="start" class="time-picker--container">
        <ion-datetime-button datetime={startTimePickerId} />
        <ion-modal>
          <ion-datetime
            id={startTimePickerId}
            value={hour.start_time}
            presentation="time"
            hour-cycle="h23"
            show-default-buttons="true"
          />
        </ion-modal>
        <div> - </div>
        <ion-datetime-button datetime={endTimePickerId} />
        <ion-modal>
          <ion-datetime
            id={endTimePickerId}
            value={hour.end_time}
            presentation="time"
            hour-cycle="h23"
            show-default-buttons="true"
          />
        </ion-modal>
      </div>
      {[
        'raw',
        /* html */ `<script>
${startTimePickerId}.addEventListener('ionChange', event => {
  let value = event.detail.value
  emit('${serviceUrl}/timeslot/${timeslot_id}/hour','update',${hour.id},'start_time',value)
})
${endTimePickerId}.addEventListener('ionChange', event => {
  let value = event.detail.value
  emit('${serviceUrl}/timeslot/${timeslot_id}/hour','update',${hour.id},'end_time',value)
})
</script>`,
      ]}
      <div slot="end">
        <ion-buttons>
          <ion-button
            size="small"
            color="danger"
            onclick={`emit('${serviceUrl}/timeslot/${timeslot_id}/hour','remove','${hour_id}')`}
          >
            <ion-icon name="trash" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </div>
    </ion-item>
  )
}

function getDateRange() {
  let date = new Date()
  let min = date.toISOString()
  date.setFullYear(date.getFullYear() + 1)
  let max = date.toISOString()
  return { min, max }
}

let addPage = (
  <>
    {Style(/* css */ `
#AddServiceDetail .hint {
  margin-inline-start: 1rem;
  margin-block: 0.25rem;
}
`)}
    <ion-header>
      <ion-toolbar>
        <IonBackButton href="/service-detail" backText={pageTitle} />
        <ion-title role="heading" aria-level="1">
          {addPageTitle}
        </ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content id="AddServiceDetail" class="ion-padding">
      <form
        method="POST"
        action="/service-detail/add/submit"
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
    let id = 1
    return <Redirect href={`/service-detail/result?id=${id}`} />
  } catch (error) {
    return (
      <Redirect
        href={
          '/service-detail/result?' +
          new URLSearchParams({ error: String(error) })
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
          <IonBackButton href="/service-detail/add" backText="Form" />
          <ion-title role="heading" aria-level="1">
            Submitted {pageTitle}
          </ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content id="AddServiceDetail" class="ion-padding">
        {error ? (
          renderError(error, context)
        ) : (
          <>
            <p>Your submission is received (#{id}).</p>
            <Link href="/service-detail" tagName="ion-button">
              Back to {pageTitle}
            </Link>
          </>
        )}
      </ion-content>
    </>
  )
}

function attachRoutes(app: Router) {
  app.post(
    '/shop/:shop_slug/service/:service_slug/image',
    async (req, res, next) => {
      try {
        let {
          params: { shop_slug, service_slug },
          query: { name: field_name, id: option_id },
        } = object({
          params: object({
            shop_slug: string({ nonEmpty: true }),
            service_slug: string({ nonEmpty: true }),
          }),
          query: object({
            name: values(['cover', 'option']),
            id: optional(id()),
          }),
        }).parse(req)
        let shop = find(proxy.shop, { slug: shop_slug })
        if (!shop) throw new HttpError(404, 'shop not found')
        let service = find(proxy.service, {
          shop_id: shop.id!,
          slug: service_slug,
        })
        if (!service) throw new HttpError(404, 'service not found')

        // TODO check if option_id is given when field_name is option
        // TODO check if this option belong to this service
        // TODO check if the user is shop owner

        let dir = join('public', 'assets', 'shops', shop_slug, service_slug)
        let filename =
          field_name == 'cover' ? 'cover.webp' : `option-${option_id}.webp`
        let form = new Formidable({
          uploadDir: dir,
          filename: () => filename + '.tmp',
          filter: part => part.mimetype == 'image/webp',
          maxFiles: 1,
          maxFileSize: client_config.max_image_size,
        })
        let [fields, files] = await form.parse(req)
        let file = files.file?.[0].filepath
        if (!file) throw new HttpError(400, 'missing file')
        renameSync(file, file.replace(/\.tmp$/, ''))
        res.json({})
      } catch (error) {
        next(error)
      }
    },
  )
  app.post(
    '/shop/:shop_slug/service/:service_slug/receipt',
    async (req, res, next) => {
      try {
        let {
          params: { shop_slug, service_slug },
          query: { booking_id },
        } = object({
          params: object({
            shop_slug: string({ nonEmpty: true }),
            service_slug: string({ nonEmpty: true }),
          }),
          query: object({
            booking_id: id(),
          }),
        }).parse(req)
        let shop = find(proxy.shop, { slug: shop_slug })
        if (!shop) throw new HttpError(404, 'shop not found')
        let service = find(proxy.service, {
          shop_id: shop.id!,
          slug: service_slug,
        })
        if (!service) throw new HttpError(404, 'service not found')
        let booking = proxy.booking[booking_id]
        if (!booking) throw new HttpError(404, 'booking not found')

        let context: ExpressContext = {
          type: 'express',
          req,
          res,
          next,
          url: req.url,
        }

        let user = getAuthUser(context)
        if (!user) throw new HttpError(401, 'need to login as user')
        if (booking.user_id != user.id)
          throw new HttpError(403, 'not your own booking')

        let dir = join(
          'public',
          'assets',
          'shops',
          shop_slug,
          service_slug,
          'receipts',
        )
        mkdirSync(dir, { recursive: true })

        let form = new Formidable({
          uploadDir: dir,
          filename: () => randomUUID() + '.webp',
          filter: part => part.mimetype == 'image/webp',
          maxFiles: 10,
          maxFileSize: client_config.max_image_size,
        })
        let [fields, files] = await form.parse(req)
        let nodes: Node[] = []
        for (let file of files.file || []) {
          let id = proxy.receipt.push({
            booking_id,
            filename: file.newFilename,
            upload_time: Date.now(),
          })
          nodes.push(ReceiptFigure({ receipt: proxy.receipt[id] }, context))
        }
        res.json({
          fragment: nodes.length == 0 ? '' : nodeToHTML([nodes], context),
        })
      } catch (error) {
        next(error)
      }
    },
  )
}

let registerParser = object({
  nickname: string({ nonEmpty: true }),
  email: email(),
})

let submitBookingParser = object({
  appointment_time: date(),
  amount: int({ min: 1 }),
  option_id: id(),
  tel: string(),
})

let routes: Routes = {
  '/shop/:shop_slug/service/:service_slug': {
    resolve(context) {
      return resolveServiceRoute(context, ({ service, shop }) => {
        let service_name = service.name
        let action = '了解和預約'
        return {
          title: title(concat_words(action, service_name) + ' | ' + shop.name),
          description: concat_words(action, service_name) + ' @' + shop.name,
          node: <ServiceDetail service={service} />,
        }
      })
    },
  },
  '/check-tel': {
    resolve(context) {
      if (context.type !== 'ws') {
        return {
          title: apiEndpointTitle,
          description: 'check if the tel is registered',
          node: 'This api is only available over ws',
        }
      }
      let tel = context.args?.[0] as string
      tel = to_full_hk_mobile_phone(tel || '')
      if (!tel) throw EarlyTerminate
      let is_registered =
        find(proxy.user, { tel }) || find(proxy.user, { tel: tel.slice(-8) })
      if (is_registered) {
        throw new MessageException([
          'update-in',
          '#guestInfo',
          nodeToVNode(
            <>
              <ion-note color="dark" class="ion-margin">
                這個電話號碼已經註冊了，歡迎再次預約！
                <br />
                （請按「立即預約」繼續）
              </ion-note>
              <div class="guestInfo--message"></div>
            </>,
            context,
          ),
        ])
      } else {
        throw new MessageException([
          'update-in',
          '#guestInfo',
          nodeToVNode(
            <>
              <ion-note color="dark" class="ion-margin">
                這個電話號碼未登記，請提供更多聯絡資料。
              </ion-note>
              <ion-item>
                <div slot="start">
                  <ion-icon name="at-outline"></ion-icon> 電郵
                </div>
                <ion-input type="email" name="email" />
              </ion-item>
              <ion-item>
                <div slot="start">
                  <ion-icon name="happy-outline"></ion-icon> 名稱
                </div>
                <ion-input name="nickname" />
              </ion-item>
              <div class="guestInfo--message"></div>
            </>,
            context,
          ),
        ])
      }
    },
  },
  '/shop/:shop_slug/service/:service_slug/booking/submit': {
    resolve(context) {
      return resolveServiceRoute(
        context,
        ({ service, shop, service_slug, shop_slug }) => {
          let body = getContextFormBody(context)
          let input = submitBookingParser.parse(body)
          let tel = to_full_hk_mobile_phone(input.tel)
          if (!tel) {
            throw new MessageException([
              'eval',
              `showToast('請輸入香港的手提電話號碼','error')`,
            ])
          }
          // TODO check confirmed booking to see if amount is too big
          if (input.amount > service.quota!) {
            throw new MessageException([
              'eval',
              `showToast('人數不可超過${service.quota}${service.price_unit}','error')`,
            ])
          }
          let user = getAuthUser(context)
          let should_verify_email = !user
          console.log({ should_verify_email })
          if (!user) {
            user = find(proxy.user, { tel }) || null
          }
          if (!user) {
            let input = registerParser.parse(body)
            if (find(proxy.user, { email: input.email })) {
              throw new MessageException([
                'eval',
                `showToast('這個電郵已經註冊過了，請檢查您的電話號碼和電郵是否正確。','error')`,
              ])
            }
            let user_id = proxy.user.push({
              username: null,
              nickname: input.nickname,
              password_hash: null,
              email: input.email,
              tel: tel,
              avatar: null,
            })
            user = proxy.user[user_id]
          }
          let booking_id = proxy.booking.push({
            service_id: service.id!,
            submit_time: Date.now(),
            appointment_time: input.appointment_time.getTime(),
            approve_time: null,
            reject_time: null,
            cancel_time: null,
            amount: input.amount,
            service_option_id: input.option_id,
            user_id: user.id!,
          })
          let booking = proxy.booking[booking_id]
          if (should_verify_email) {
            let email = user.email!
            let hint = maskEmailForHint(email)
            let mailboxUrl = 'https://' + email.split('@').pop()
            let passcode = generatePasscode()
            proxy.verification_code.push({
              passcode,
              email,
              request_time: Date.now(),
              revoke_time: null,
              match_id: null,
              user_id: user.id!,
              shop_id: shop.id!,
            })
            let { html, text } = verificationCodeEmail(
              { passcode, email },
              context,
            )
            sendEmail({
              from: config.email.auth.user,
              to: email,
              subject: title('Email'),
              html,
              text,
            })
              .then(info => {
                if (context.type === 'ws') {
                  context.ws.send([
                    'batch',
                    [
                      [
                        'eval',
                        `showToast('請查看 ${hint} 郵箱，並點擊確認連接，以確認你的預約。','info')`,
                      ],
                      [
                        'update-in',
                        '#guestInfo .guestInfo--message',
                        nodeToVNode(
                          <p>
                            請查看{' '}
                            <a href={mailboxUrl} target="_blank">
                              {hint}
                            </a>{' '}
                            郵箱，並點擊確認連接，以確認你的預約。
                          </p>,
                          context,
                        ),
                      ],
                    ],
                  ])
                }
              })
              .catch(error => {
                console.error('Failed to send email', error)
                if (context.type === 'ws') {
                  context.ws.send([
                    'update-in',
                    '#guestInfo .guestInfo--message',
                    renderError(error, context),
                  ])
                }
              })
            throw EarlyTerminate
          }
          throw new MessageException([
            'batch',
            [
              [
                'update-in',
                '#submitModal',
                nodeToVNode(PaymentModal({ booking }, context), context),
              ],
              ['eval', 'submitModal.present()'],
            ],
          ])
        },
      )
    },
  },
  '/shop/:shop_slug/service/:service_slug/booking/:booking_id/cancel': {
    resolve(context) {
      return resolveServiceRoute(
        context,
        ({ service, shop, service_slug, shop_slug }) => {
          let booking_id = context.routerMatch?.params.booking_id
          let booking = proxy.booking[booking_id]
          // TODO check user

          booking.cancel_time = Date.now()

          throw new MessageException([
            'batch',
            [
              ['eval', 'showToast("已取消預約","info")'],
              [
                'eval',
                /* javascript */ `
document.querySelectorAll('#submitModal').forEach(modal => modal.dismiss())
`,
              ],
            ],
          ])
        },
      )
    },
  },
  '/shop/:shop_slug/service/:service_slug/receipt/:receipt_id/delete': {
    resolve(context) {
      return resolveServiceRoute(
        context,
        ({ service, shop, service_slug, shop_slug }) => {
          let user = getAuthUser(context)

          let receipt_id = context.routerMatch?.params.receipt_id
          let receipt = proxy.receipt[receipt_id]

          if (receipt && user && receipt.booking?.user_id == user.id) {
            let dir = join(
              'public',
              'assets',
              'shops',
              shop_slug,
              service_slug,
              'receipts',
            )
            let file = join(dir, receipt.filename)
            unlinkSync(file)
            delete proxy.receipt[receipt_id]
          }

          throw new MessageException([
            'batch',
            [
              ['eval', 'showToast("已刪除收據相片","info")'],
              ['remove', `.receipt--item[data-receipt-id="${receipt_id}"]`],
            ],
          ])
        },
      )
    },
  },
  '/shop/:shop_slug/service/:service_slug/admin': {
    resolve(context) {
      return resolveServiceRoute(context, ({ service, shop }) => {
        let service_name = service.name
        let action = '管理'
        return {
          title: title(concat_words(action, service_name) + ' | ' + shop.name),
          description: concat_words(action, service_name) + ' @' + shop.name,
          node: <ManageService service={service} />,
        }
      })
    },
  },
  '/shop/:shop_slug/service/:service_slug/update': {
    resolve(context) {
      if (context.type !== 'ws') {
        return {
          title: apiEndpointTitle,
          description: 'update service details',
          node: 'This api is only available over ws',
        }
      }
      return resolveServiceRoute(
        context,
        ({ service, shop, shop_slug, service_slug }) => {
          try {
            let { 0: field, 1: value } = object({
              0: values([
                'name' as const,
                'unit_price' as const,
                'price_unit' as const,
                'quota' as const,
                'hours' as const,
                'book_duration_minute' as const,
                'address' as const,
                'address_remark' as const,
              ]),
              1: string({ trim: true, nonEmpty: false }),
            }).parse(context.args)

            let label: string
            let ok = () => {
              throw new MessageException([
                'eval',
                `showToast('更新了${label}','info')`,
              ])
            }
            let invalid = () => {
              throw new MessageException([
                'eval',
                `showToast('無效的${label}','error')`,
              ])
            }

            switch (field) {
              case 'name':
                label = '標題'
                service[field] = value
                ok()
                break
              case 'unit_price':
                label = '費用 (單價)'
                if (value.startsWith('$')) {
                  let val = +value.substring(1)
                  if (!val && val != 0) invalid()
                  value = val.toString()
                }
                service[field] = value
                ok()
                break
              case 'price_unit':
                label = '費用 (單位)'
                service[field] = value
                ok()
                break
              case 'quota':
                label = '人數上限'
                if (!Number.isInteger(+value) || +value < 1) invalid()
                service[field] = +value
                ok()
                break
              case 'hours':
                label = '時長 (顯示)'
                service[field] = value
                ok()
                break
              case 'book_duration_minute':
                label = '時長 (計算)'
                if (!(+value > 0)) invalid()
                service[field] = +value
                ok()
                break
              case 'address':
                label = '地址 (街道)'
                service[field] = value || null
                ok()
                break
              case 'address_remark':
                label = '地址 (備註)'
                service[field] = value || null
                ok()
                break
              default:
                field satisfies never
            }
            throw new Error('not supported fields: ' + field)
          } catch (error) {
            if (error instanceof MessageException) throw error
            throw new MessageException([
              'eval',
              `showToast(${JSON.stringify(String(error))},'error')`,
            ])
          }
        },
      )
    },
  },
  '/shop/:shop_slug/service/:service_slug/option/name': {
    resolve(context) {
      if (context.type !== 'ws') {
        return {
          title: apiEndpointTitle,
          description: 'update service option name',
          node: 'This api is only available over ws',
        }
      }
      return resolveServiceRoute(
        context,
        ({ service, shop, shop_slug, service_slug }) => {
          let {
            args: { '0': option_id, 1: option_name },
          } = object({
            type: literal('ws'),
            args: object({ 0: id(), 1: string({ nonEmpty: true }) }),
          }).parse(context)
          let option = find(proxy.service_option, {
            id: +option_id!,
            service_id: service.id!,
          })
          if (!option) {
            throw new MessageException([
              'eval',
              `showAlert('option #${option_id} not found','error')`,
            ])
          }
          // TODO check if the user is shop owner
          option.name = option_name

          throw new MessageException([
            'eval',
            `showToast('updated option name','success')`,
          ])
        },
      )
    },
  },
  '/shop/:shop_slug/service/:service_slug/timeslot/:timeslot_id/update': {
    resolve(context) {
      if (context.type !== 'ws') {
        return {
          title: apiEndpointTitle,
          description: 'remove service available timeslot by id',
          node: 'This api is only available over ws',
        }
      }
      return resolveServiceRoute(
        context,
        ({ service, shop, shop_slug, service_slug }) => {
          // TODO check if the user is shop owner
          let timeslot_id = context.routerMatch?.params.timeslot_id
          let timeslot = find(proxy.service_timeslot, {
            service_id: service.id!,
            id: timeslot_id,
          })
          if (!timeslot) {
            throw new MessageException([
              'eval',
              `showToast('timeslot not found','error')`,
            ])
          }

          let { 0: field, 1: value } = object({
            0: values([
              'start_date' as const,
              'end_date' as const,
              'weekdays' as const,
            ]),
            1: string(),
          }).parse(context.args)

          switch (field) {
            case 'start_date':
              timeslot.start_date = toDatePart(
                new TimezoneDate(date().parse(value).getTime()),
              )
              throw new MessageException([
                'eval',
                `showToast('更新了開始日期','info')`,
              ])
            case 'end_date':
              timeslot.end_date = toDatePart(
                new TimezoneDate(date().parse(value).getTime()),
              )
              throw new MessageException([
                'eval',
                `showToast('更新了結束日期','info')`,
              ])
            case 'weekdays':
              timeslot.weekdays = value
              throw new MessageException([
                'eval',
                `showToast('更新了可選擇星期','info')`,
              ])
            default:
              throw new MessageException([
                'eval',
                `showToast('unknown field ${field satisfies never}','error')`,
              ])
          }
        },
      )
    },
  },
  '/shop/:shop_slug/service/:service_slug/timeslot/:timeslot_id/remove': {
    resolve(context) {
      if (context.type !== 'ws') {
        return {
          title: apiEndpointTitle,
          description: 'remove service available timeslot by id',
          node: 'This api is only available over ws',
        }
      }
      return resolveServiceRoute(
        context,
        ({ service, shop, shop_slug, service_slug }) => {
          let new_timeslot_count =
            count(proxy.service_timeslot, {
              service_id: service.id!,
            }) - 1
          if (new_timeslot_count === 0) {
            throw new MessageException([
              'eval',
              `showToast('需要至少一個時段','error')`,
            ])
          }

          let timeslot_id = context.routerMatch?.params.timeslot_id

          let timeslot = find(proxy.service_timeslot, {
            service_id: service.id!,
            id: timeslot_id,
          })
          if (!timeslot) {
            throw EarlyTerminate
          }
          // TODO check if the user is shop owner

          del(proxy.timeslot_hour, { service_timeslot_id: timeslot_id })
          delete proxy.service_timeslot[timeslot_id]

          context.ws.send([
            'batch',
            [
              [
                'remove',
                `.available-timeslot--item[data-timeslot-id="${timeslot_id}"]`,
              ],
              ['eval', `showToast('取消了一組時段','warning')`],
              [
                'update-text',
                '.available-timeslot--list .list-description p',
                `共 ${new_timeslot_count} 組時段`,
              ],
              [
                'remove',
                '.available-timeslot--item:first-child ion-item-divider',
              ],
            ],
          ])
          throw EarlyTerminate
        },
      )
    },
  },
  '/shop/:shop_slug/service/:service_slug/timeslot/add': {
    resolve(context) {
      if (context.type !== 'ws') {
        return {
          title: apiEndpointTitle,
          description: 'add service available timeslot',
          node: 'This api is only available over ws',
        }
      }
      return resolveServiceRoute(
        context,
        ({ service, shop, shop_slug, service_slug }) => {
          let timeslots = filter(proxy.service_timeslot, {
            service_id: service.id!,
          })
          let new_timeslot_count = timeslots.length + 1
          let timeslot = timeslots[timeslots.length - 1]
          if (!timeslot) {
            let date = new TimezoneDate()
            let str = toDatePart(date)
            timeslot = {} as any
            timeslot.start_date = str
            timeslot.end_date = str
          }
          // TODO check if the user is shop owner
          let timeslot_id = proxy.service_timeslot.push({
            service_id: service.id!,
            start_date: timeslot.start_date,
            end_date: timeslot.end_date,
            weekdays: '',
          })
          timeslot = proxy.service_timeslot[timeslot_id]
          // TODO send ws message
          let serviceUrl = `/shop/${shop_slug}/service/${service_slug}`
          context.ws.send([
            'batch',
            [
              [
                'insert-before',
                '.available-timeslot--list .list-description',
                nodeToVNode(
                  TimeslotItem({
                    service_timeslot: timeslot,
                    is_first_slot: new_timeslot_count == 1,
                    dateRange: getDateRange(),
                    serviceUrl,
                  }),
                  context,
                ),
              ],
              [
                'update-text',
                '.available-timeslot--list .list-description p',
                `共 ${new_timeslot_count} 組時段`,
              ],
            ],
          ])
          throw EarlyTerminate
        },
      )
    },
  },
  '/shop/:shop_slug/service/:service_slug/timeslot/:timeslot_id/hour': {
    resolve(context) {
      if (context.type !== 'ws') {
        return {
          title: title('method not supported'),
          description: 'update service option name',
          node: 'This api is only available over ws',
        }
      }
      let timeslot_id = +context.routerMatch?.params.timeslot_id
      return resolveServiceRoute(
        context,
        ({ service, shop, shop_slug, service_slug }) => {
          let {
            args: { '0': action, 1: hour_id, 2: field, 3: field_value },
          } = object({
            type: literal('ws'),
            args: object({
              0: values(['remove' as const, 'add' as const, 'update' as const]),
              1: optional(int()),
              2: optional(values(['start_time' as const, 'end_time' as const])),
              3: optional(string({ nonEmpty: true, match: /^\d{2}:\d{2}$/ })),
            }),
          }).parse(context)
          let timeslot = find(proxy.service_timeslot, {
            id: timeslot_id,
            service_id: service.id!,
          })
          if (!timeslot) {
            throw new MessageException([
              'eval',
              `showAlert('timeslot #${timeslot_id} not found','error')`,
            ])
          }
          // TODO check if the user is shop owner
          switch (action) {
            case 'add': {
              // clone last timeslot hour
              let hours = filter(proxy.timeslot_hour, {
                service_timeslot_id: timeslot_id,
              })
              let hour = hours.pop()
              if (!hour) {
                hour = {} as TimeslotHour
                hour.start_time = '15:00'
                hour.end_time = '17:00'
              }
              hour_id = proxy.timeslot_hour.push({
                service_timeslot_id: timeslot_id,
                start_time: hour.start_time,
                end_time: hour.end_time,
              })
              hour = proxy.timeslot_hour[hour_id]
              let serviceUrl = `/shop/${shop_slug}/service/${service_slug}`
              throw new MessageException([
                'append',
                `.time-picker--list[data-timeslot-id="${timeslot_id}"]`,
                nodeToVNode(
                  TimePickerListItem({
                    serviceUrl,
                    timeslot_id,
                    hour,
                  }),
                  context,
                ),
              ])
            }
            case 'remove': {
              // remove if it is not the last timeslot hour
              let hours = filter(proxy.timeslot_hour, {
                service_timeslot_id: timeslot_id,
              })
              if (hours.length <= 1) {
                throw new MessageException([
                  'eval',
                  `showToast('需要至少一個時段','error')`,
                ])
              }
              let hour = proxy.timeslot_hour[hour_id!]
              if (!hour || hour.service_timeslot_id != timeslot_id) {
                throw EarlyTerminate
              }
              let part = hour.start_time + '-' + hour.end_time
              delete proxy.timeslot_hour[hour_id!]
              throw new MessageException([
                'batch',
                [
                  ['remove', `[data-timeslot-hour-id="${hour_id}"]`],
                  ['eval', `showToast('取消了 ${part}','warning')`],
                ],
              ])
            }
            case 'update': {
              let hour = proxy.timeslot_hour[hour_id!]
              if (
                !hour ||
                hour.service_timeslot_id != timeslot_id ||
                !field ||
                !field_value
              ) {
                throw EarlyTerminate
              }
              hour[field] = field_value
              let part = hour.start_time + '-' + hour.end_time
              throw new MessageException([
                'eval',
                `showToast('更新了 ${part}','info')`,
              ])
            }
            default:
              throw new MessageException([
                'eval',
                `showToast('unknown action: ${action satisfies never}','error')`,
              ])
          }
        },
      )
    },
  },
  '/service-detail/add': {
    title: title(addPageTitle),
    description: 'TODO',
    node: <AddPage />,
    streaming: false,
  },
  '/service-detail/add/submit': {
    title: apiEndpointTitle,
    description: 'TODO',
    node: <Submit />,
    streaming: false,
  },
  '/service-detail/result': {
    title: apiEndpointTitle,
    description: 'TODO',
    node: <SubmitResult />,
    streaming: false,
  },
}

export default { routes, attachRoutes }

declare var timeRadioGroup: HTMLElement
declare var bookingForm: HTMLFormElement
declare var selectedTimeButton: HTMLFormElement
