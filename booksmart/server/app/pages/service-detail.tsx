import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { apiEndpointTitle, title } from '../../config.js'
import Style from '../components/style.js'
import { DynamicContext, getContextFormBody } from '../context.js'
import { mapArray } from '../components/fragment.js'
import { IonBackButton } from '../components/ion-back-button.js'
import {
  date,
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
  Service,
  ServiceTimeslot,
  TimeslotHour,
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
import { loadClientPlugin } from '../../client-plugin.js'
import { Router } from 'express'
import { HttpError } from '../../http-error.js'
import { join } from 'path'
import { Formidable } from 'formidable'
import { renameSync } from 'fs'
import { EarlyTerminate, MessageException } from '../helpers.js'
import { nodeToVNode } from '../jsx/vnode.js'
import { client_config } from '../../../client/client-config.js'
import { TimezoneDate } from 'timezone-date.ts'

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
`)

function ServiceDetail(attrs: { service: Service }, context: DynamicContext) {
  let { service } = attrs
  let shop = service.shop!
  let shop_slug = shop!.slug
  let { slug: service_slug } = service
  let address = service.address || shop.address
  let address_remark = service.address_remark || shop.address_remark
  let options = filter(proxy.service_option, { service_id: service.id! })
  let locale = getShopLocale(shop.id!)
  let images = getServiceImages(shop_slug, service_slug)
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
              href={context.url + '/admin'}
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
            images={[images.cover, ...images.more, ...images.options].map(
              url => (
                <img src={url} />
              ),
            )}
            showPagination
            showArrow
          />
        </div>
        <h2 class="ion-margin" hidden>
          {service.name}
        </h2>
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
              {mapArray(options, (option, index) => (
                <ion-button
                  size="small"
                  fill={options.length == 1 ? 'solid' : 'outline'}
                  onclick="selectOption(this)"
                  data-id={option.id}
                  data-index={index + 1}
                >
                  {option.name}
                </ion-button>
              ))}
            </div>
          </ion-item>
          {Script(/* javascript */ `
function selectOption(button){
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
              <ion-icon name="cash-outline"></ion-icon> 費用
            </div>
            <ion-label id="priceLabel">
              {service.unit_price
                ? '$' + service.unit_price + '/' + service.price_unit
                : service.price_unit}
            </ion-label>
          </ion-item>
          <ion-item>
            <div slot="start">
              <ion-icon name="people-outline"></ion-icon> 人數
            </div>
            <ion-input
              placeholder="1"
              type="number"
              min="1"
              max={service.quota}
              /* TODO avoid overbook */
              oninput={`priceLabel.textContent='$'+${service.unit_price}*(this.value||1)+'/'+this.value+'${service.price_unit}'`}
            />
            <ion-label slot="end">{service.price_unit}</ion-label>
          </ion-item>
          <ion-item>
            <div slot="start">
              <ion-icon name="hourglass-outline"></ion-icon> 時長
            </div>
            <ion-label>{service.hours}</ion-label>
          </ion-item>
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
              >
                <span slot="title">預約日期</span>
              </ion-datetime>
            </ion-modal>
          </ion-item>
          {Script(/* javascript */ `
    datePicker.isDateEnabled = isDateEnabled
    function isDateEnabled(dateString) {
      let date = new Date(dateString)
      let day = date.getDay()
      if (day == 0 || day == 6) return true
      return false
    }
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
                >
                  <ion-item>
                    <ion-radio value="9:00">9:00 - 11:00</ion-radio>
                  </ion-item>
                  <ion-item>
                    <ion-radio value="9:30">9:30 - 11:30</ion-radio>
                  </ion-item>
                  <ion-item>
                    <ion-radio value="10:00">10:00 - 12:00</ion-radio>
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
          {!address ? null : address_remark ? (
            <ion-accordion-group>
              <ion-accordion value="address">
                <ion-item slot="header">
                  <div slot="start">
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
        <div class="ion-margin">
          <ion-button fill="block" color="primary" class="ion-margin">
            Submit
          </ion-button>
        </div>
        {wsStatus.safeArea}
      </ion-content>
    </>
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
  let address_remark = service.address_remark || shop.address_remark
  let options = filter(proxy.service_option, { service_id: service.id! })
  let locale = getShopLocale(shop.id!)
  let serviceUrl = `/shop/${shop_slug}/service/${service_slug}`
  let dateRange = getDateRange()
  let service_timeslot_rows = filter(proxy.service_timeslot, {
    service_id: service.id!,
  })
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
        <ion-list lines="full" inset="true" style="margin-bottom: 0.5rem">
          <ion-item>
            <div slot="start">
              <ion-icon name="people-outline"></ion-icon> 標題
            </div>
            <ion-input placeholder="輸入一個簡短的標題" value={service.name} />
          </ion-item>
          <ion-item>
            <div slot="start">
              <ion-icon name="cash-outline"></ion-icon> 費用
            </div>
            <div class="d-flex" style="align-items: center; gap: 0.25rem">
              <span>$</span>
              <ion-input value={service.unit_price} />
              <span>/</span>
              <ion-input value={service.price_unit} />
            </div>
            <div slot="helper">
              如: $100/人 、 $150/對情侶 、 $0/📐 量身訂做
            </div>
          </ion-item>
          <ion-item>
            <div slot="start">
              <ion-icon name="people-outline"></ion-icon> 人數
            </div>
            <ion-input value={service.quota} placeholder="如: 6人 / 2對情侶" />
          </ion-item>
          <ion-item>
            <div slot="start">
              <ion-icon name="hourglass-outline"></ion-icon> 時長
            </div>
            <ion-input value={service.hours} placeholder="如: 2.5 - 3 小時" />
          </ion-item>
        </ion-list>
        <div class="ion-text-center">
          <ion-button color="primary">
            <ion-icon name="save" slot="start" />
            <span class="button-text">Save</span>
          </ion-button>
        </div>

        <h2 class="ion-margin">可預約時段</h2>
        <ion-list
          lines="full"
          inset="true"
          style="margin-bottom: 0.5rem"
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

        <h2 class="ion-margin">Others</h2>
        <ion-list lines="full" inset="true">
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
              >
                <span slot="title">預約日期</span>
              </ion-datetime>
            </ion-modal>
          </ion-item>
          {Script(/* javascript */ `
datePicker.isDateEnabled = isDateEnabled
function isDateEnabled(dateString) {
let date = new Date(dateString)
let day = date.getDay()
if (day == 0 || day == 6) return true
return false
}
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
                >
                  <ion-item>
                    <ion-radio value="9:00">9:00 - 11:00</ion-radio>
                  </ion-item>
                  <ion-item>
                    <ion-radio value="9:30">9:30 - 11:30</ion-radio>
                  </ion-item>
                  <ion-item>
                    <ion-radio value="10:00">10:00 - 12:00</ion-radio>
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
          {!address ? null : address_remark ? (
            <ion-accordion-group>
              <ion-accordion value="address">
                <ion-item slot="header">
                  <div slot="start">
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
}

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
  '/shop/:shop_slug/service/:service_slug/option/name': {
    resolve(context) {
      if (context.type !== 'ws') {
        return {
          title: title('method not supported'),
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
                    is_first_slot: false,
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
