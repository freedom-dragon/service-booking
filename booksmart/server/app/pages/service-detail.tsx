import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { apiEndpointTitle, config, title } from '../../config.js'
import Style from '../components/style.js'
import {
  Context,
  DynamicContext,
  ExpressContext,
  WsContext,
  getContextFormBody,
} from '../context.js'
import { mapArray } from '../components/fragment.js'
import { IonBackButton } from '../components/ion-back-button.js'
import { id, literal, object, optional, string, values } from 'cast.ts'
import { Link, Redirect } from '../components/router.js'
import { renderError } from '../components/error.js'
import { getAuthUser } from '../auth/user.js'
import { Service, proxy } from '../../../db/proxy.js'
import { filter, find } from 'better-sqlite3-proxy'
import {
  getServiceCoverImage,
  getServiceImages,
  getServiceOptionImage,
  getShopLocale,
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

let pageTitle = 'Service Detail'
let addPageTitle = 'Add Service Detail'

let ServiceDetailStyle = Style(/* css */ `
#ServiceDetail {

}
.preview-image,
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
          <ion-title role="heading" aria-level="1">
            {service.name}
          </ion-title>
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
        <Swiper
          id="ServiceImages"
          images={[
            <img src={getServiceCoverImage(shop_slug, service_slug)} />,
            ...options.map(option => (
              <img
                src={getServiceOptionImage(shop_slug, service_slug, option.id!)}
              />
            )),
          ]}
          showPagination
        />
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
            <ion-label>{service.price}</ion-label>
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
            />
            <ion-label slot="end"> / {service.quota}</ion-label>
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
                  onionChange="console.log(event)"
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
`)
let ManageServiceScripts = (
  <>
    {loadClientPlugin({ entryFile: 'dist/client/image.js' }).node}
    {loadClientPlugin({ entryFile: 'dist/client/sweetalert.js' }).node}
    {Script(/* javascript */ `
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
            <ion-input
              value={service.price}
              placeholder="如: $100/人 、 $150/對情侶"
            />
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
        <ion-list lines="full" inset="true" style="margin-bottom: 0.5rem">
          <ion-item>xx</ion-item>
          <ion-item>xx</ion-item>
          <ion-item>xx</ion-item>
          <ion-item-divider class="list-description" color="light">
            <p>
              {options.length > 0
                ? `共 ${options.length} 組時段`
                : `未有任何時段`}
            </p>
          </ion-item-divider>
          <div class="text-center">
            <ion-button onclick="addOption()">
              <ion-icon name="cloud-upload" slot="start"></ion-icon>
              加時段
            </ion-button>
          </div>
        </ion-list>
        <div class="ion-text-center">
          <ion-button color="primary">
            <ion-icon name="save" slot="start" />
            <span class="button-text">Save</span>
          </ion-button>
        </div>

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
                <ion-input label={'款式' + (i + 1)} value={option.name} />
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
                款式相
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
                  onionChange="console.log(event)"
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
          maxFileSize: config.max_image_size,
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
          node: <p>This api is only available in over ws</p>,
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
            return {
              title: title('option not found'),
              description: 'The option is not found by id',
              node: (
                <Redirect
                  href={`/shop/${shop_slug}/service/${service_slug}/admin`}
                />
              ),
            }
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
