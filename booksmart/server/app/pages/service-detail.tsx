import httpStatus from 'http-status'
import { o } from '../jsx/jsx.js'
import { Routes, redirectDict } from '../routes.js'
import { apiEndpointTitle, title } from '../../config.js'
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
  email,
  id,
  int,
  literal,
  object,
  optional,
  string,
  values,
} from 'cast.ts'
import { Link, Redirect } from '../components/router.js'
import { renderError } from '../components/error.js'
import { getAuthUser } from '../auth/user.js'
import {
  Booking,
  Receipt,
  Service,
  ServiceOption,
  ServiceRemark,
  ServiceTimeslot,
  Shop,
  TimeslotHour,
  User,
  proxy,
} from '../../../db/proxy.js'
import { count, del, filter, find } from 'better-sqlite3-proxy'
import {
  getReceiptImage,
  getServiceCoverImage,
  getServiceImages,
  getServiceMoreImage,
  getServiceOptionImage,
  getShopLocale,
  renameServiceSlug,
} from '../shop-store.js'
import { Swiper } from '../components/swiper.js'
import { wsStatus } from '../components/ws-status.js'
import { Script } from '../components/script.js'
import { resolveServiceRoute } from '../shop-route.js'
import { concat_words } from '@beenotung/tslib/string.js'
import { to_full_hk_mobile_phone } from '@beenotung/tslib/validate.js'
import { loadClientPlugin } from '../../client-plugin.js'
import { Router } from 'express'
import { toRouteUrl } from '../../url.js'
import { basename, join } from 'path'
import { existsSync, renameSync, unlinkSync } from 'fs'
import { EarlyTerminate, MessageException, HttpError } from '../../exception.js'
import { nodeToVNode } from '../jsx/vnode.js'
import { TimezoneDate } from 'timezone-date.ts'
import { toLocaleDateTimeString } from '../components/datetime.js'
import { maskEmailForHint } from '../email-mask.js'
import { generatePasscode, verificationCodeEmail } from './verification-code.js'
import { sendEmail } from '../../email.js'
import { Node } from '../jsx/types.js'
import {
  noticeBookingReceiptSubmit,
  noticeBookingSubmit,
} from '../app-email.js'
import { ServerMessage } from '../../../client/types.js'
import { createUploadForm } from '../upload.js'
import {
  BookingPreview,
  bookingPreviewStyle,
} from '../components/booking-preview.js'
import { calcBookingTotalFee } from '../../../db/service-store.js'
import { env } from '../../env.js'
import { ServiceTimeslotPicker } from '../components/service-timeslot-picker.js'
import { formatTel } from '../components/tel.js'
import { getAuthRole } from '../auth/role.js'
import { toDatePart } from '../format/date.js'
import { countBooking, selectAvailableQuota } from '../booking-store.js'
import { db } from '../../../db/db.js'
import { formatPrice } from '../format/price.js'
import { nodeToHTML } from '../jsx/html.js'
import { ReceiptImageItem } from './booking.js'
import { toServiceUrl } from '../app-url'
import { formatDuration } from '../format/duration.js'

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

function ServiceDetail(attrs: { service: Service }, context: DynamicContext) {
  let { service } = attrs
  let shop = service.shop!
  let shop_slug = shop!.slug
  let { slug: service_slug, desc } = service
  let address = service.address || shop.address
  let address_remark = service.address_remark || shop.address_remark
  let options = filter(proxy.service_option, { service_id: service.id! })
  let remarks = filter(proxy.service_remark, { service_id: service.id! })
  remarks = remarks.filter(remark => remark.title || remark.content)
  let locale = getShopLocale(shop.id!)
  let serviceUrl = `/shop/${shop_slug}/service/${service_slug}`
  let images = getServiceImages(shop_slug, service_slug)
  let user = getAuthUser(context)
  let is_shop_owner = user && user.id == shop.owner_id

  let params = new URLSearchParams(context.routerMatch?.search)
  let tel = params.get('tel')

  // address_remark = ''

  let booking =
    user &&
    filter(proxy.booking, {
      user_id: user.id!,
      service_id: service.id!,
      approve_time: null,
      reject_time: null,
      cancel_time: null,
    }).sort((a, b) => b.submit_time - a.submit_time)[0]

  let allImages = [images.cover, ...images.more, ...images.options]
  let optionImageOffset = 1 + images.more.length

  let quota = service.quota

  let { times, used } = countBooking({ service, user })

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
          {is_shop_owner ? (
            <ion-buttons slot="end">
              <Link
                tagName="ion-button"
                title={'管理' + locale.service}
                href={`${serviceUrl}/admin`}
              >
                <ion-icon slot="icon-only" name="create"></ion-icon>
              </Link>
            </ion-buttons>
          ) : null}
        </ion-toolbar>
      </ion-header>
      <ion-content id="ServiceDetail" color="light">
        <h1 class="ion-margin">
          {service.name} {service.archive_time ? '(已封存)' : null}
        </h1>
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
            {times == 1 ? null : (
              <ion-item>
                <div slot="start">
                  <ion-icon name="copy-outline"></ion-icon> 次數
                </div>
                <ion-label>
                  {used ? (
                    <>
                      {used}/{times}
                    </>
                  ) : (
                    times
                  )}
                </ion-label>
              </ion-item>
            )}
            <ion-item hidden={times == 1 ? undefined : ''}>
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
                    ? `priceLabel.textContent= '$' + ((+this.value||1) >= (${service.peer_amount} || Infinity) ? ${service.peer_price} * (this.value||1) : ${service.unit_price} * (this.value||1)) + '/' + this.value + '${service.price_unit}';`
                    : '')
                }
              />
              <ion-label slot="end">{service.price_unit}</ion-label>
            </ion-item>
            <ion-note class="item--hint">
              上限: {quota} {service.price_unit}
            </ion-note>
            <ion-item>
              <div slot="start">
                <ion-icon name="hourglass-outline"></ion-icon> 時長
              </div>
              <ion-label>{formatDuration(service)}</ion-label>
            </ion-item>
            <input name="appointment_time" hidden />

            <ServiceTimeslotPicker
              service={service}
              datePicker="datePicker"
              timeRadioGroup="timeRadioGroup"
              bookingForm="bookingForm"
              selectedTimeButton="selectedTimeButton"
              onSelectDateFn="onSelectDateFn"
            />
            <ion-item-divider style="min-height:2px"></ion-item-divider>

            {service.question ? (
              <ion-item>
                <div slot="start">
                  <ion-icon name="help-circle-outline"></ion-icon> 備註
                </div>
                <div>
                  <ion-label>{service.question}</ion-label>
                  <ion-textarea name="answer" auto-grow />
                </div>
              </ion-item>
            ) : null}

            {/*
            For guest: ask tel
              if tel in DB, ask email and auth code
              if tel is new, ask name, email and auth code

            For user: show name, tel, email

            For shop: similar to guest flow, without need for auth code
            */}
            {!user || is_shop_owner ? (
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
                    value={tel}
                    oninput="this.value.length == 8 && emit('/check-tel', this.value)"
                  />
                </ion-item>
                {tel
                  ? Script(/* javascript */ `
                  setTimeout(function(){
                    emit('/check-tel', ${JSON.stringify(tel)})
                  })
                  `)
                  : null}
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
                  <ion-input
                    type="tel"
                    name="tel"
                    readonly
                    value={formatTel(user.tel!)}
                  />
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
            <ion-label
              style={used > 0 ? 'text-decoration: line-through' : undefined}
            >
              {service.original_price ? (
                <div style="text-decoration: line-through">
                  原價:{' '}
                  {+service.original_price
                    ? '$' + service.original_price
                    : service.original_price}
                </div>
              ) : null}
              費用{' '}
              <span id="priceLabel">
                {+service.unit_price!
                  ? '$' + service.unit_price + '/' + service.price_unit
                  : service.unit_price}
              </span>
              {service.peer_amount && service.peer_price ? (
                <div>
                  {service.peer_amount}人同行，每人
                  {formatPrice(service.peer_price)}
                </div>
              ) : null}
            </ion-label>
            <ion-button
              size="normal"
              color="primary"
              slot="end"
              class="ion-padding-horizontal"
              style="--ion-padding: 2rem; padding: 0"
              onclick="submitBooking()"
            >
              立即預約
            </ion-button>
          </ion-item>
        </ion-list>
      </ion-footer>
      <ion-modal id="submitModal">
        {booking &&
        user &&
        !booking.approve_time &&
        !booking.reject_time &&
        !booking.cancel_time ? (
          <>
            <PaymentModal booking={booking} user={user} />
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

function PaymentModal(
  attrs: { booking: Booking; user: User },
  context: Context,
) {
  let { booking, user } = attrs
  let service = booking.service!
  let service_slug = service.slug
  let shop = service.shop!
  let shop_slug = shop.slug
  let serviceUrl = `/shop/${shop_slug}/service/${service_slug}`
  let receipts = filter(proxy.receipt, { booking_id: booking.id! })
  let { used } = countBooking({ service, user })
  let total_price = booking.total_price
  let is_free = +total_price! === 0
  let has_paid = receipts.length > 0
  let need_pay = used == 0
  let is_shop_owner = getAuthUser(context)?.id == shop.owner_id
  return (
    <>
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            {!is_shop_owner &&
            need_pay &&
            !has_paid &&
            !is_free &&
            !booking.approve_time &&
            !booking.reject_time &&
            !booking.cancel_time ? (
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
        {bookingPreviewStyle}
        <BookingPreview booking={booking} />

        {need_pay ? (
          <>
            <h1>總共費用</h1>
            <div id="totalPriceLabel"></div>
            <div>{formatPrice(total_price)}</div>
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
                onclick={`uploadReceipt('${serviceUrl}/receipt?booking_id=${booking.id}&from=service-detail')`}
              >
                <ion-icon name="cloud-upload" slot="start"></ion-icon>
                上傳付款證明
              </ion-button>
            </div>
            <div id="receiptImageList">
              {mapArray(receipts, receipt =>
                ReceiptFigure({ receipt }, context),
              )}
            </div>{' '}
          </>
        ) : null}

        <p class="receiptMessage ion-text-center">
          {!need_pay || is_free
            ? ReceiptMessage.free(shop)
            : has_paid
              ? ReceiptMessage.paid(shop)
              : ReceiptMessage.not_paid}
        </p>
        <div id="receiptNavButtons">
          {is_free || has_paid ? receiptNavButton : null}
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
      <img src={getReceiptImage(shop_slug, service_slug, receipt.filename)} />
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
let ReceiptMessage = {
  not_paid:
    '請注意，你的預約在上載付款證明之後才會生效。在此之前，這個時段可能會被其他人預約。',
  paid: (shop: Shop) =>
    `已上載付款證明，請等待 ${'商家' || shop.owner!.nickname} 確認`,
  free: (shop: Shop) =>
    `已提交預約申請，請等待 ${'商家' || shop.owner!.nickname} 確認`,
}
let receiptNavButton = nodeToVNode(
  <Link tagName="ion-button" expand="block" href="/booking" class="ion-margin">
    查看我的預約
  </Link>,
  { type: 'static' },
)

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
#ManageService .add-container .preview-image,
#ManageService .more-item img,
#ManageService .service-option img {
  margin: 0 1rem 0.5rem;
  margin-bottom: 0;
  width: calc(100vw - 64px);
  height: calc(100vw - 64px);
  border-radius: 0.25rem;
  object-fit: cover;
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
async function archiveService(title, url) {
  if(!await showConfirm({
    title,
    icon: 'warning',
    confirmButtonText: '封存',
  })) {
    return
  }
  emit(url)
}
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
  let serviceOption = editButton.closest('.more-item') || editButton.closest('.service-option')
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
  let serviceOption = button.closest('.more-item') || button.closest('.service-option')
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
    return json
  }
  button.querySelector('.button-text').textContent = 'Uploaded'
  button.color = 'success'
  button.disabled = true
  return json
}
// TODO impl del item for more photo and service-option
async function addOption(button) {
  let image = await selectServiceImage()
  let previewImage = button.closest('.add-container').querySelector('.preview-image')
  let addButton = button.closest('.add-container').querySelector('.add-button')
  let uploadButton = button.closest('.add-container').querySelector('.upload-button')
  let cancelButton = button.closest('.add-container').querySelector('.cancel-button')
  addButton.file = image.file
  previewImage.src = image.dataUrl
  previewImage.hidden = false
  addButton.hidden = true
  uploadButton.hidden = false
  cancelButton.hidden = false
}
function cancelNewOptionImage(button) {
  let previewImage = button.closest('.add-container').querySelector('.preview-image')
  let addButton = button.closest('.add-container').querySelector('.add-button')
  let uploadButton = button.closest('.add-container').querySelector('.upload-button')
  let cancelButton = button.closest('.add-container').querySelector('.cancel-button')
  previewImage.src = ''
  previewImage.hidden = true
  addButton.hidden = false
  uploadButton.hidden = true
  cancelButton.hidden = true
  return {addButton}
}
async function uploadNewOptionImage(button) {
  let addButton = button.closest('.add-container').querySelector('.add-button')
  let listDescription = button.closest('ion-list').querySelector('.list-description')
  let file = addButton.file
  let json = await uploadImage(addButton, file)
  if (json.error) return
  // show new item and update count
  let image_div = document.createElement('div')
  image_div.innerHTML = json.image_node
  let image_node = image_div.children[0]
  listDescription.insertAdjacentElement('beforebegin', image_node)
  listDescription.querySelector('p').textContent =
    listDescription.dataset.nonEmptyMessage
    .replace('{count}', json.image_count)
  let buttons = cancelNewOptionImage(button)
  setTimeout(() => {
    buttons.addButton.color = 'primary'
    buttons.addButton.querySelector('.button-text').textContent = '加更多相片'
    buttons.addButton.disabled = false
  }, 1500)
}
function updateListCount(name, count){
  let list = document.querySelector('ion-list[data-list-name="'+name+'"]')

  // update list item total count
  let listDescription = list.querySelector('.list-description')
  let p = listDescription.querySelector('p')
  p.textContent = count > 0
    ? listDescription.dataset.nonEmptyMessage
      .replace('{count}', count)
    : listDescription.dataset.emptyMessage

  // update list item index
  let nodes = list.querySelectorAll('[data-role="index"]')
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].textContent = i + 1
  }
}
`)}
  </>
)
function ManageService(attrs: { service: Service }, context: DynamicContext) {
  let { service } = attrs
  let { user } = getAuthRole(context)
  let shop = service.shop!
  let is_shop_owner = user?.id == shop.owner_id
  let shop_slug = shop!.slug
  let { slug: service_slug } = service
  let address = service.address || shop.address
  let options = filter(proxy.service_option, { service_id: service.id! })
  let locale = getShopLocale(shop.id!)
  let serviceUrl = `/shop/${shop_slug}/service/${service_slug}`
  if (!is_shop_owner) {
    return <Redirect href={serviceUrl} />
  }
  let remarks = filter(proxy.service_remark, { service_id: service.id! })
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
  let archive_title = JSON.stringify(
    concat_words('確認封存', service.name) + '，並不再展示？',
  )
  let archive_url = JSON.stringify(
    toRouteUrl(routes, '/shop/:shop_slug/service/:service_slug/archive', {
      params: {
        shop_slug,
        service_slug,
      },
    }),
  )
  let images = getServiceImages(shop_slug, service_slug)
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
          <ion-buttons slot="end">
            <ion-button
              color="dark"
              size="small"
              title={concat_words('封存', service.name)}
              onclick={`archiveService(${archive_title}, ${archive_url})`}
            >
              <ion-icon name="archive-outline" slot="icon-only"></ion-icon>
            </ion-button>
          </ion-buttons>
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
              <ion-icon name="globe-outline"></ion-icon> 網址
            </div>
            <ion-input
              placeholder="選擇一個獨特的網址"
              value={service.slug}
              onchange={`emit('${serviceUrl}/update','slug',this.value)`}
            />
          </ion-item>
          <ion-note class="item--hint" style="margin:0">
            <div class="ion-margin-horizontal">
              格式：
              {mapArray(
                [
                  'a-z',
                  'A-Z',
                  '0-9',
                  '- (hyphen)',
                  '_ (underscore)',
                  '. (dot)',
                ],
                s => (
                  <span style="display:inline-block">{s}</span>
                ),
                <>
                  , <wbr />
                </>,
              )}
            </div>
            <div class="ion-margin">
              預覽：
              <code
                id="urlPreview"
                style="
                  color: #111;
                  background: #eee;
                  padding: 0.5rem;
                  border-radius: 0.5rem;
                  display: inline-block;
                  word-break: break-word;
                "
                onclick="copyUrl()"
              >
                {env.ORIGIN + serviceUrl}
              </code>
              {Script(/* javascript */ `
function copyUrl() {
  let range = document.createRange();
  range.selectNode(urlPreview);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);
  let result = document.execCommand('copy');
  showToast('已複製到剪貼簿', 'info')
}
`)}
            </div>
          </ion-note>
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
              <ion-icon name="copy-outline"></ion-icon> 次數
            </div>
            <div class="d-flex" style="align-items: center; gap: 0.25rem">
              <ion-input
                value={service.times || 1}
                type="number"
                min="1"
                onchange={`emit('${serviceUrl}/update','times',this.value)`}
              />
            </div>
          </ion-item>
          <ion-note class="item--hint">如：一次付費，三次服務的套票</ion-note>
          <ion-item>
            <div slot="start">
              <ion-icon name="cash-outline"></ion-icon> 原價
            </div>
            <div class="d-flex" style="align-items: center; gap: 0.25rem">
              <ion-input
                value={service.original_price}
                type="text"
                onchange={`emit('${serviceUrl}/update','original_price',this.value)`}
                placeholder="可選輸入"
              />
            </div>
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
          </ion-item>
          <ion-note class="item--hint">
            如: $100/人 、 $150/對情侶 、 📐 量身訂做/位
          </ion-note>
          <ion-item>
            <div slot="start">
              <ion-icon name="cash-outline"></ion-icon> 同行價
            </div>
            <div class="d-flex" style="align-items: center; gap: 0.25rem">
              <ion-input
                style="width: 2rem; text-align: end"
                value={service.peer_amount}
                placeholder="多"
                type="text"
                onchange={`emit('${serviceUrl}/update','peer_amount',this.value)`}
              />
              <span style="padding-bottom: 0.25rem">人同行，每人</span>
              <ion-input
                style="width: 4rem"
                value={service.peer_price}
                placeholder="優惠價"
                onchange={`emit('${serviceUrl}/update','peer_price',this.value)`}
              />
            </div>
          </ion-item>
          <ion-note class="item--hint">如: 2人同行，每人$50</ion-note>
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
          </ion-item>
          <ion-note class="item--hint">如: 6(人) / 2(對情侶)</ion-note>
          <ion-item>
            <div slot="start">
              <ion-icon name="hourglass-outline"></ion-icon> 時長
            </div>
            <div slot="end">分鐘</div>
            <ion-input
              value={service.book_duration_minute}
              placeholder="如: 120"
              onchange={`emit('${serviceUrl}/update','book_duration_minute',this.value)`}
              type="number"
              min="1"
            />
          </ion-item>
          <ion-note class="item--hint">
            系統會以這個分鐘數作為計算。建議輸入每節最長時間。
          </ion-note>
          <ion-item>
            <div>
              <ion-icon name="map-outline"></ion-icon> 備註 (額外問題)
              <div>
                <ion-textarea
                  value={service.question}
                  placeholder="可選輸入"
                  auto-grow
                  onchange={`emit('${serviceUrl}/update','question',this.value)`}
                />
              </div>
            </div>
          </ion-item>
        </ion-list>

        <h2 class="ion-margin">活動詳情</h2>
        <ion-list
          lines="full"
          inset="true"
          style="margin-bottom: 0.5rem; padding-bottom: 0.5rem;"
        >
          <ion-item>
            <div>
              <ion-icon name="map-outline"></ion-icon> 活動詳情
              <div>
                <ion-textarea
                  value={service.desc}
                  placeholder="可選輸入"
                  auto-grow
                  onchange={`emit('${serviceUrl}/update','desc',this.value)`}
                />
              </div>
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
          </ion-item>
          {address ? (
            <ion-note
              style1="display: flex; align-items: center; gap: 1rem"
              class="w-100 item--hint"
            >
              預覽
              <ion-button
                fill="block"
                color="primary"
                size="normal"
                class="ion-margin-horizontal"
                href={
                  'https://www.google.com/maps/search/' +
                  encodeURIComponent(address)
                }
                target="_blank"
              >
                <ion-icon name="map-outline" slot="start"></ion-icon>
                View on Map
              </ion-button>
            </ion-note>
          ) : null}
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

        <h2 class="ion-margin">注意事項</h2>
        <ion-list
          data-list-name="service-remark"
          lines="full"
          inset="true"
          style="margin-bottom: 0.5rem; padding-bottom: 0.5rem;"
        >
          {mapArray(remarks, (remark, index) =>
            ServiceRemarkItem({
              serviceUrl,
              index,
              remark,
            }),
          )}
          <ion-item-divider
            class="list-description"
            color="light"
            data-non-empty-message="共 {count} 條注意事項"
            data-empty-message="未有任何注意事項"
          >
            <p>
              {remarks.length > 0
                ? `共 ${remarks.length} 條注意事項`
                : `未有任何注意事項`}
            </p>
          </ion-item-divider>
          <div class="text-center">
            <ion-button onclick={`emit('${serviceUrl}/remark/add')`}>
              <ion-icon name="add" slot="start"></ion-icon>
              加注意事項
            </ion-button>
          </div>
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
      object-fit: cover;
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

        <h2 class="ion-margin">更多相片</h2>
        <ion-list inset="true" class="more-list">
          {mapArray(images.more, (image, index) =>
            MoreItem({ serviceUrl, index, image }),
          )}
          <ion-item-divider
            class="list-description"
            color="light"
            data-non-empty-message="共 {count} 相片"
            data-empty-message="未有更多相片"
          >
            <p>
              {images.more.length > 0
                ? `共 ${images.more.length} 相片`
                : `未有更多相片`}
            </p>
          </ion-item-divider>
          <div class="text-center add-container">
            <div>
              <img class="preview-image" hidden />
            </div>
            <ion-button
              onclick="addOption(this)"
              class="add-button"
              data-url={serviceUrl + '/image?name=more&new=1'}
            >
              <ion-icon name="cloud-upload" slot="start"></ion-icon>
              <span class="button-text">加更多相片</span>
            </ion-button>
            <ion-button
              onclick="cancelNewOptionImage(this)"
              color="medium"
              class="cancel-button"
              hidden
            >
              <ion-icon name="trash" slot="start"></ion-icon>
              <span class="button-text">Cancel</span>
            </ion-button>
            <ion-button
              onclick="uploadNewOptionImage(this)"
              color="dark"
              class="upload-button"
              hidden
            >
              <ion-icon name="cloud-upload" slot="start"></ion-icon>
              <span class="button-text">Upload</span>
            </ion-button>
          </div>
        </ion-list>

        <h2 class="ion-margin">款式</h2>
        <ion-list inset="true" class="service-option-list">
          {mapArray(options, (option, index) =>
            ServiceOptionItem({
              serviceUrl,
              index,
              option,
              image: getServiceOptionImage(shop_slug, service_slug, option.id!),
            }),
          )}
          <ion-item-divider
            class="list-description"
            color="light"
            data-non-empty-message="共 {count} 款"
            data-empty-message="未有任何款式"
          >
            <p>
              {options.length > 0 ? `共 ${options.length} 款` : `未有任何款式`}
            </p>
          </ion-item-divider>
          <div class="text-center add-container">
            <div>
              <img class="preview-image" hidden />
            </div>
            <ion-button
              onclick="addOption(this)"
              class="add-button"
              data-url={serviceUrl + '/image?name=option&new=1'}
            >
              <ion-icon name="cloud-upload" slot="start"></ion-icon>
              <span class="button-text">加款式</span>
            </ion-button>
            <ion-button
              onclick="cancelNewOptionImage(this)"
              color="medium"
              class="cancel-button"
              hidden
            >
              <ion-icon name="trash" slot="start"></ion-icon>
              <span class="button-text">Cancel</span>
            </ion-button>
            <ion-button
              onclick="uploadNewOptionImage(this)"
              color="dark"
              class="upload-button"
              hidden
            >
              <ion-icon name="cloud-upload" slot="start"></ion-icon>
              <span class="button-text">Upload</span>
            </ion-button>
          </div>
        </ion-list>

        {wsStatus.safeArea}
      </ion-content>
      {ManageServiceScripts}
    </>
  )
}
function ServiceRemarkItem(attrs: {
  serviceUrl: string
  index: number
  remark: ServiceRemark
}) {
  let { serviceUrl, index, remark } = attrs
  return (
    <div class="service-remark" data-remark-id={remark.id}>
      {index > 0 ? <ion-item-divider></ion-item-divider> : null}
      <div class="ion-margin-start">
        注意事項 <span data-role="index">{index + 1}</span>
      </div>
      <ion-item>
        <ion-input
          label="標題"
          value={remark.title}
          onchange={`emit('${serviceUrl}/remark/title',${remark.id},this.value,'標題')`}
        />
        <ion-buttons slot="end">
          <ion-button
            color="danger"
            onclick={`emit(${JSON.stringify(
              serviceUrl + `/remark/${remark.id}/delete`,
            )})`}
          >
            <ion-icon name="trash" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-item>
      <ion-item>
        <ion-textarea
          label="細節"
          value={remark.content}
          onchange={`emit('${serviceUrl}/remark/content',${remark.id},this.value,'細節')`}
        />
      </ion-item>
    </div>
  )
}
function MoreItem(attrs: { serviceUrl: string; index: number; image: string }) {
  let { serviceUrl, index, image } = attrs
  let filename = basename(image)
  return (
    <div class="more-item" data-more-index={index}>
      {index > 0 ? <ion-item-divider></ion-item-divider> : null}
      <ion-item lines="none">
        <ion-input label={'相片' + (index + 1)} value={filename} readonly />
        <ion-buttons slot="end">
          <ion-button onclick="editOptionImage(this)" color="primary">
            <ion-icon name="create" slot="icon-only" />
          </ion-button>
          <ion-button
            color="danger"
            onclick={`emit(${JSON.stringify(
              serviceUrl + `/more/${filename}/delete?index=${index}`,
            )})`}
          >
            <ion-icon name="trash" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-item>
      <img src={image} class="preview-image" />
      <div class="text-center">
        <ion-button
          hidden
          onclick="uploadOptionImage(this)"
          data-url={serviceUrl + '/image?name=more&file=' + basename(image)}
          class="upload-button"
        >
          <ion-icon name="cloud-upload" slot="start"></ion-icon>
          <span class="button-text">Upload</span>
        </ion-button>
      </div>
    </div>
  )
}
function ServiceOptionItem(attrs: {
  serviceUrl: string
  index: number
  image: string
  option: ServiceOption
}) {
  let { serviceUrl, index, image, option } = attrs
  return (
    <div class="service-option" data-option-id={option.id}>
      {index > 0 ? <ion-item-divider></ion-item-divider> : null}
      <ion-item>
        <ion-input
          label={'款式 ' + (index + 1) + ' 標題'}
          value={option.name}
          onchange={`emit('${serviceUrl}/option/name',${option.id},this.value)`}
        />
        <ion-buttons slot="end">
          <ion-button
            color="danger"
            onclick={`emit(${JSON.stringify(
              serviceUrl + `/option/${option.id}/delete`,
            )})`}
          >
            <ion-icon name="trash" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-item>
      <h3 class="ion-margin-horizontal d-flex">
        款式 {index + 1} 相片
        <ion-buttons style="display: inline-flex">
          <ion-button onclick="editOptionImage(this)" color="primary">
            <ion-icon name="create" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </h3>
      <img src={image} class="preview-image" />
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
          <p class="item--hint">(3-50 characters)</p>
          <ion-item>
            <ion-input
              name="slug"
              label="Slug*: (unique url)"
              label-placement="floating"
              required
              pattern="(\w|-|\.){1,32}"
            />
          </ion-item>
          <p class="item--hint">
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
          query: {
            name: field_name,
            id: option_id,
            file: more_file,
            new: is_new,
          },
        } = object({
          params: object({
            shop_slug: string({ nonEmpty: true }),
            service_slug: string({ nonEmpty: true }),
          }),
          query: object({
            name: values(['cover', 'more', 'option']),
            id: optional(id()),
            file: optional(string()),
            new: optional(int()),
          }),
        }).parse(req)
        let serviceUrl = `/shop/${shop_slug}/service/${service_slug}`
        let shop = find(proxy.shop, { slug: shop_slug })
        if (!shop) throw new HttpError(404, 'shop not found')
        let service = find(proxy.service, {
          shop_id: shop.id!,
          slug: service_slug,
        })
        if (!service) throw new HttpError(404, 'service not found')

        let context: ExpressContext = {
          type: 'express',
          req,
          res,
          next,
          url: req.url,
        }
        let { user } = getAuthRole(context)
        let is_shop_owner = user?.id == shop.owner_id
        if (!is_shop_owner) {
          throw new HttpError(
            user ? httpStatus.FORBIDDEN : httpStatus.UNAUTHORIZED,
            'only shop owner can upload service image',
          )
        }

        let filename: string = ''
        let image_count: number | null = null
        let image_url = ''
        let image_node = ''

        if (field_name == 'cover') {
          filename = 'cover.webp'
        }

        if (field_name == 'more') {
          if (is_new) {
            let images = getServiceImages(shop_slug, service_slug).more.map(
              file => basename(file),
            )
            image_count = images.length + 1
            for (let i = 1; ; i++) {
              more_file = `more-${i}.webp`
              if (images.includes(more_file)) {
                continue
              }
              image_url = getServiceMoreImage(
                shop_slug,
                service_slug,
                more_file,
              )
              image_node = nodeToHTML(
                MoreItem({
                  image: image_url,
                  index: image_count - 1,
                  serviceUrl,
                }),
                context,
              )
              break
            }
          }

          if (!more_file) throw new HttpError(400, 'missing more_file')
          more_file = basename(more_file)
          filename = more_file
        }

        if (field_name == 'option') {
          if (is_new) {
            option_id = proxy.service_option.push({
              service_id: service.id!,
              name: '',
            })
            image_count = count(proxy.service_option, {
              service_id: service.id!,
            })
            image_url = getServiceOptionImage(
              shop_slug,
              service_slug,
              option_id,
            )
            image_node = nodeToHTML(
              ServiceOptionItem({
                serviceUrl,
                index: image_count - 1,
                image: image_url,
                option: proxy.service_option[option_id],
              }),
              context,
            )
          }

          if (!option_id) throw new HttpError(400, 'missing option_id')

          let option = proxy.service_option[option_id]
          if (!option) throw new HttpError(404, 'service option not found')

          if (option.service_id !== service.id!)
            throw new HttpError(400, 'service option not belong to the service')

          filename = `option-${option_id}.webp`
        }

        if (!filename) {
          throw new HttpError(501, 'filename not determined')
        }

        let dir = join('public', 'assets', 'shops', shop_slug, service_slug)

        let form = createUploadForm({
          uploadDir: dir,
          filename: filename + '.tmp',
        })
        let [fields, files] = await form.parse(req)
        let file = files.file?.[0].filepath
        if (!file) throw new HttpError(400, 'missing file')
        renameSync(file, file.replace(/\.tmp$/, ''))
        res.json({
          image_count,
          image_url,
          image_node,
        })
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
          query: { booking_id, from },
        } = object({
          params: object({
            shop_slug: string({ nonEmpty: true }),
            service_slug: string({ nonEmpty: true }),
          }),
          query: object({
            booking_id: id(),
            from: values(['service-detail' as const, 'booking' as const]),
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
        if (booking.user_id != user.id && shop.owner_id != user.id)
          throw new HttpError(403, 'not your own booking')

        let dir = join(
          'public',
          'assets',
          'shops',
          shop_slug,
          service_slug,
          'receipts',
        )

        let form = createUploadForm({
          uploadDir: dir,
          maxFiles: 10,
        })
        let [fields, files] = await form.parse(req)
        let nodes: Node[] = (files.file || []).map(file => {
          let id = proxy.receipt.push({
            booking_id,
            filename: file.newFilename,
            upload_time: Date.now(),
          })
          if (from == 'booking') {
            return ReceiptImageItem(shop_slug, service_slug, file.newFilename)
          }
          return ReceiptFigure({ receipt: proxy.receipt[id] }, context)
        })
        let messages: ServerMessage[] = []
        if (nodes.length > 0) {
          // TODO support updating in the booking tab
          if (from == 'service-detail') {
            noticeBookingReceiptSubmit(booking, context)
            let receiptMessage = ReceiptMessage.paid(shop)
            messages.push(
              ['append', '#receiptImageList', nodeToVNode([nodes], context)],
              [
                'update-in',
                '#submitModal ion-header ion-buttons',
                <ion-button onclick="submitModal.dismiss()">返回</ion-button>,
              ],
              ['update-text', '.receiptMessage', receiptMessage],
              ['eval', `showAlert(${JSON.stringify(receiptMessage)},'info')`],
              ['update-in', '#receiptNavButtons', receiptNavButton],
            )
          }
          if (from == 'booking') {
            let receipt_count = count(proxy.receipt, { booking_id })
            messages.push(
              [
                'update-text',
                `ion-card[data-booking-id="${booking.id}"] .receipt-desc`,
                `上載了 ${receipt_count} 張收據`,
              ],
              [
                'append',
                `ion-card[data-booking-id="${booking.id}"] details`,
                nodeToVNode([nodes], context),
              ],
              ['eval', `showAlert('已上載付款證明','info')`],
            )
          }
        }
        let message: ServerMessage = ['batch', messages]
        res.json({
          message,
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
  answer: string(),
})

let routes = {
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
          let availableQuota = selectAvailableQuota({
            service_id: service.id!,
            appointment_time: input.appointment_time.getTime(),
          })
          // TODO check confirmed booking to see if amount is too big
          if (input.amount > availableQuota) {
            throw new MessageException([
              'eval',
              availableQuota > 0
                ? `showToast('所選擇時段只淨${availableQuota}${service.price_unit}','error')`
                : `showToast('所選擇時段沒有空位','error')`,
            ])
          }
          let user = getAuthUser(context)
          let is_shop_owner = user && user.id == shop.owner_id
          let should_verify_email = !user
          if (!user || is_shop_owner) {
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
          let user_id = user.id!
          let booking: Booking = db.transaction(() => {
            let booking_id = proxy.booking.push({
              service_id: service.id!,
              submit_time: Date.now(),
              appointment_time: input.appointment_time.getTime(),
              approve_time: null,
              arrive_time: null,
              reject_time: null,
              cancel_time: null,
              amount: input.amount,
              service_option_id: input.option_id,
              user_id,
              total_price: null,
              answer: input.answer,
            })
            let booking = proxy.booking[booking_id]
            let fee = calcBookingTotalFee(booking)
            booking.total_price = fee.total_fee
            if (fee.is_free) {
              noticeBookingSubmit(booking, context)
            }
            return booking
          })()
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
              user_id,
              shop_id: shop.id!,
            })
            let { html, text } = verificationCodeEmail(
              { passcode, email },
              context,
            )
            let email_success_messages: ServerMessage[] = is_shop_owner
              ? [
                  [
                    'eval',
                    `showToast('已發送電郵通知給 ${user.nickname}。','info')`,
                  ],
                  [
                    'update-in',
                    '#guestInfo .guestInfo--message',
                    nodeToVNode(
                      <p>已發送電郵通知給 {user.nickname}。</p>,
                      context,
                    ),
                  ],
                ]
              : [
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
                ]
            sendEmail({
              from: env.EMAIL_USER,
              to: email,
              subject: title(`${service.name} 預約確認`),
              html,
              text,
            })
              .then(info => {
                if (context.type === 'ws') {
                  context.ws.send(['batch', email_success_messages])
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
                nodeToVNode(
                  PaymentModal({ booking: booking!, user }, context),
                  context,
                ),
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
          if (!booking)
            throw new MessageException([
              'eval',
              `showToast("找不到相應的預約，ID：${booking_id}","warning")`,
            ])

          let { user } = getAuthRole(context)
          if (!user)
            throw new MessageException([
              'eval',
              'showToast("請先登入","warning")',
            ])

          if (booking.user_id !== user.id && user.id !== shop.owner_id)
            throw new MessageException([
              'eval',
              'showToast("不可以取消其他人的預約","warning")',
            ])

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
          let has_receipt = true

          if (receipt && user && receipt.booking?.user_id == user.id) {
            let booking_id = receipt.booking_id!
            let dir = join(
              'public',
              'assets',
              'shops',
              shop_slug,
              service_slug,
              'receipts',
            )
            let file = join(dir, receipt.filename)
            if (existsSync(file)) {
              unlinkSync(file)
            }
            delete proxy.receipt[receipt_id]
            has_receipt = count(proxy.receipt, { booking_id }) > 0
          }

          let receiptMessage = has_receipt
            ? '已刪除收據相片'
            : ReceiptMessage.not_paid
          let messages: ServerMessage[] = [
            ['remove', `.receipt--item[data-receipt-id="${receipt_id}"]`],
            ['eval', `showToast(${JSON.stringify(receiptMessage)},"info")`],
          ]
          if (has_receipt) {
            messages.push(['update-in', '#receiptNavButtons', receiptNavButton])
          } else {
            messages.push(
              ['update-text', '.receiptMessage', receiptMessage],
              ['update-text', '#receiptNavButtons', ''],
            )
          }
          throw new MessageException(['batch', messages])
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
            let { user } = getAuthRole(context)
            if (shop.owner_id != user?.id)
              throw 'Only shop owner can update the service'
            let { 0: field, 1: value } = object({
              0: values([
                'slug' as const,
                'name' as const,
                'times' as const,
                'original_price' as const,
                'unit_price' as const,
                'price_unit' as const,
                'peer_amount' as const,
                'peer_price' as const,
                'quota' as const,
                'book_duration_minute' as const,
                'address' as const,
                'address_remark' as const,
                'question' as const,
                'desc' as const,
              ]),
              1: string({ trim: true, nonEmpty: false }),
            }).parse(context.args)

            let label: string
            let ok = (message?: ServerMessage) => {
              let toast: ServerMessage = [
                'eval',
                `showToast('更新了${label}','info')`,
              ]
              if (message) {
                message = ['batch', [toast, message]]
              } else {
                message = toast
              }
              throw new MessageException(message)
            }
            let invalid = (message = `無效的${label}`) => {
              message = JSON.stringify(message)
              throw new MessageException([
                'eval',
                `showToast(${message},'error')`,
              ])
            }

            switch (field) {
              case 'slug':
                label = '網址'
                if (service_slug == value) throw EarlyTerminate
                for (let char of ['/', '%', '"', "'"]) {
                  if (value.includes(char)) {
                    invalid('網址不可包括 ' + char)
                  }
                }
                value = value.replaceAll(' ', '')
                if (
                  find(proxy.service, {
                    shop_id: service.shop_id,
                    slug: value,
                  })
                )
                  throw new MessageException([
                    'eval',
                    `showToast('此網址已被使用','error')`,
                  ])
                service[field] = value
                renameServiceSlug(shop_slug, service_slug, value)
                ok([
                  'redirect',
                  toRouteUrl(
                    routes,
                    '/shop/:shop_slug/service/:service_slug/admin',
                    {
                      params: {
                        shop_slug,
                        service_slug: value,
                      },
                    },
                  ),
                ])
                break
              case 'name':
                label = '標題'
                service[field] = value
                ok()
                break
              case 'times':
                label = '次數'
                if (!Number.isInteger(+value) || +value < 1) invalid()
                service[field] = +value
                ok()
                break
              case 'original_price':
                label = '原價'
                if (value.startsWith('$')) {
                  let val = +value.substring(1)
                  if (!val && val != 0) invalid()
                  value = val.toString()
                }
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
              case 'peer_amount':
                label = '同行人數'
                if (!Number.isInteger(+value) || +value < 0) invalid()
                service[field] = +value || null
                ok()
                break
              case 'peer_price':
                label = '同行優惠價'
                if (value.startsWith('$')) {
                  let val = +value.substring(1)
                  if (!val && val != 0) invalid()
                  value = val.toString()
                }
                service[field] = value
                ok()
                break
              case 'quota':
                label = '人數上限'
                if (!Number.isInteger(+value) || +value < 1) invalid()
                service[field] = +value
                ok()
                break
              case 'book_duration_minute':
                label = '時長'
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
              case 'question':
                label = '額外問題'
                service[field] = value || null
                ok()
                break
              case 'desc':
                label = '活動詳情'
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
  '/shop/:shop_slug/service/:service_slug/archive': {
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
            let { user } = getAuthRole(context)
            if (shop.owner_id != user?.id)
              throw 'Only shop owner can archive the service'

            let title = service.name || service.slug
            title = concat_words('封存了', title)

            // TODO remind if there are pending bookings

            service.archive_time = Date.now()

            throw new MessageException([
              'batch',
              [
                ['eval', `showToast(${JSON.stringify(title)},'info')`],
                ['redirect', `/shop/${shop_slug}`],
              ],
            ])
          } catch (error) {
            if (error instanceof MessageException) throw error
            console.log(error)
            throw new MessageException([
              'eval',
              `showToast(${JSON.stringify(String(error))},'error')`,
            ])
          }
        },
      )
    },
  },
  '/shop/:shop_slug/service/:service_slug/remark/add': {
    resolve(context) {
      if (context.type !== 'ws') {
        return {
          title: apiEndpointTitle,
          description: 'add service remark',
          node: 'This api is only available over ws',
        }
      }
      return resolveServiceRoute(
        context,
        ({ service, shop, shop_slug, service_slug }) => {
          let { user } = getAuthRole(context)
          let is_shop_owner = user?.id == shop.owner_id
          if (!is_shop_owner) {
            throw new MessageException([
              'eval',
              `showToast('only shop owner can add timeslot','error')`,
            ])
          }

          let remark_id = proxy.service_remark.push({
            service_id: service.id!,
            title: '',
            content: '',
          })
          let remark = proxy.service_remark[remark_id]
          let new_count = count(proxy.service_remark, {
            service_id: service.id!,
          })
          let serviceUrl = `/shop/${shop_slug}/service/${service_slug}`
          context.ws.send([
            'batch',
            [
              [
                'insert-before',
                '[data-list-name="service-remark"] .list-description',
                nodeToVNode(
                  ServiceRemarkItem({
                    index: new_count - 1,
                    remark,
                    serviceUrl,
                  }),
                  context,
                ),
              ],
              ['eval', `updateListCount('service-remark',${new_count})`],
            ],
          ])
          throw EarlyTerminate
        },
      )
    },
  },
  '/shop/:shop_slug/service/:service_slug/remark/:remark_id/delete': {
    resolve(context) {
      if (context.type !== 'ws') {
        return {
          title: apiEndpointTitle,
          description: 'delete service remark',
          node: 'This api is only available over ws',
        }
      }
      let auth = getAuthRole(context)
      let { remark_id } = context.routerMatch?.params
      return resolveServiceRoute(
        context,
        ({ service, shop, shop_slug, service_slug }) => {
          if (auth.shop?.id != service.shop_id) {
            throw new MessageException([
              'eval',
              `showToast('Only shop owner can update the service','error')`,
            ])
          }
          let remark = proxy.service_remark[remark_id]
          if (!remark) {
            throw new MessageException([
              'eval',
              `showToast('remark not found','error')`,
            ])
          }
          if (remark.service_id != service.id) {
            throw new MessageException([
              'eval',
              `showToast('remark not belong to the service','error')`,
            ])
          }

          let name = remark.title
          name = name ? `「${name}」` : ` #${remark_id}`
          delete proxy.service_remark[remark_id]
          let new_count = count(proxy.service_remark, {
            service_id: service.id!,
          })
          throw new MessageException([
            'batch',
            [
              ['remove', `.service-remark[data-remark-id="${remark_id}"]`],
              ['eval', `updateListCount('service-remark',${new_count})`],
              [
                'eval',
                `showToast(${JSON.stringify(`刪除了注意事項${name}`)},'info')`,
              ],
            ],
          ])
        },
      )
    },
  },
  '/shop/:shop_slug/service/:service_slug/remark/:field': {
    resolve(context) {
      if (context.type !== 'ws') {
        return {
          title: apiEndpointTitle,
          description: 'update service remark name',
          node: 'This api is only available over ws',
        }
      }
      return resolveServiceRoute(
        context,
        ({ service, shop, shop_slug, service_slug }) => {
          let { user } = getAuthRole(context)
          let is_shop_owner = user?.id == shop.owner_id
          if (!is_shop_owner) {
            throw new MessageException([
              'eval',
              `showAlert('not shop owner','error')`,
            ])
          }
          let {
            args: { '0': remark_id, 1: value, 2: label },
            routerMatch: {
              params: { field },
            },
          } = object({
            type: literal('ws'),
            args: object({ 0: id(), 1: string(), 2: string() }),
            routerMatch: object({
              params: object({
                field: values(['title' as const, 'content' as const]),
              }),
            }),
          }).parse(context)
          let remark = find(proxy.service_remark, {
            id: +remark_id!,
            service_id: service.id!,
          })
          if (!remark) {
            throw new MessageException([
              'eval',
              `showAlert('remark #${remark_id} not found','error')`,
            ])
          }
          remark[field] = value

          throw new MessageException([
            'eval',
            `showToast('更新了注意事項${label}','info')`,
          ])
        },
      )
    },
  },
  '/shop/:shop_slug/service/:service_slug/more/:filename/delete': {
    resolve(context) {
      if (context.type !== 'ws') {
        return {
          title: apiEndpointTitle,
          description: 'delete service more photo',
          node: 'This api is only available over ws',
        }
      }
      let auth = getAuthRole(context)
      let { filename } = context.routerMatch?.params
      let index = new URLSearchParams(context.routerMatch?.search).get('index')!
      return resolveServiceRoute(
        context,
        ({ service, shop_slug, service_slug }) => {
          if (auth.shop?.id != service.shop_id) {
            throw new MessageException([
              'eval',
              `showToast('Only shop owner can update the service','error')`,
            ])
          }
          filename = basename(filename)
          let url = getServiceMoreImage(shop_slug, service_slug, filename)
          let file = join('public', url)
          try {
            unlinkSync(file)
          } catch (error) {
            // file already deleted?
          }
          throw new MessageException([
            'batch',
            [
              ['remove', `.more-item[data-more-index="${index}"]`],
              [
                'eval',
                `showToast(${JSON.stringify(`刪除了相片${+index + 1}`)},'info')`,
              ],
            ],
          ])
        },
      )
    },
  },
  '/shop/:shop_slug/service/:service_slug/option/:option_id/delete': {
    resolve(context) {
      if (context.type !== 'ws') {
        return {
          title: apiEndpointTitle,
          description: 'delete service option',
          node: 'This api is only available over ws',
        }
      }
      let auth = getAuthRole(context)
      let { option_id } = context.routerMatch?.params
      return resolveServiceRoute(
        context,
        ({ service, shop, shop_slug, service_slug }) => {
          if (auth.shop?.id != service.shop_id) {
            throw new MessageException([
              'eval',
              `showToast('Only shop owner can update the service','error')`,
            ])
          }
          let url = getServiceOptionImage(shop_slug, service_slug, option_id)
          let file = join('public', url)
          let option = proxy.service_option[option_id]
          if (!option) {
            throw new MessageException([
              'eval',
              `showToast('option not found','error')`,
            ])
          }
          console.log({
            'option.service_id': option.service_id,
            'service.id': service.id,
          })
          if (option.service_id != service.id) {
            throw new MessageException([
              'eval',
              `showToast('option not belong to the service','error')`,
            ])
          }

          let name = option.name
          name = name ? `「${name}」` : ` #${option_id}`
          try {
            delete proxy.service_option[option_id]
          } catch (error) {
            throw new MessageException([
              'batch',
              [
                [
                  'eval',
                  `showToast(${JSON.stringify(`款式「${name}」已經有相關預訂`)},'error')`,
                ],
              ],
            ])
          }
          try {
            unlinkSync(file)
          } catch (error) {
            // file already deleted?
          }
          throw new MessageException([
            'batch',
            [
              ['remove', `.service-option[data-option-id="${option_id}"]`],
              [
                'eval',
                `showToast(${JSON.stringify(`刪除了款式${name}`)},'info')`,
              ],
            ],
          ])
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
          let { user } = getAuthRole(context)
          let is_shop_owner = user?.id == shop.owner_id
          if (!is_shop_owner) {
            throw new MessageException([
              'eval',
              `showAlert('not shop owner','error')`,
            ])
          }

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
          option.name = option_name

          throw new MessageException([
            'eval',
            `showToast('更新了款式標題','info')`,
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
          let { user } = getAuthRole(context)
          let is_shop_owner = user?.id == shop.owner_id
          if (!is_shop_owner) {
            throw new MessageException([
              'eval',
              `showToast('only shop owner can update timeslot','error')`,
            ])
          }

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
          let { user } = getAuthRole(context)
          let is_shop_owner = user?.id == shop.owner_id
          if (!is_shop_owner) {
            throw new MessageException([
              'eval',
              `showToast('only shop owner can remove timeslot','error')`,
            ])
          }

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
          let { user } = getAuthRole(context)
          let is_shop_owner = user?.id == shop.owner_id
          if (!is_shop_owner) {
            throw new MessageException([
              'eval',
              `showToast('only shop owner can add timeslot','error')`,
            ])
          }

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
          let timeslot_id = proxy.service_timeslot.push({
            service_id: service.id!,
            start_date: timeslot.start_date,
            end_date: timeslot.end_date,
            weekdays: '',
          })
          timeslot = proxy.service_timeslot[timeslot_id]
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
          title: apiEndpointTitle,
          description: 'manage service timeslot',
          node: 'This api is only available over ws',
        }
      }
      let timeslot_id = +context.routerMatch?.params.timeslot_id
      return resolveServiceRoute(
        context,
        ({ service, shop, shop_slug, service_slug }) => {
          let { user } = getAuthRole(context)
          let is_shop_owner = user?.id == shop.owner_id
          if (!is_shop_owner) {
            throw new MessageException([
              'eval',
              `showToast('only shop owner can manage timeslot','error')`,
            ])
          }

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
} satisfies Routes

export default { routes, attachRoutes }

declare var priceLabel: HTMLElement
