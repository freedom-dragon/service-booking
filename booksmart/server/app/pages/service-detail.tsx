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
import { object, string, values } from 'cast.ts'
import { Link, Redirect } from '../components/router.js'
import { renderError } from '../components/error.js'
import { getAuthUser } from '../auth/user.js'
import { Service, proxy } from '../../../db/proxy.js'
import { filter, find } from 'better-sqlite3-proxy'
import { getServiceCoverImage, getServiceImages } from '../shop-store.js'
import { Swiper } from '../components/swiper.js'
import { wsStatus } from '../components/ws-status.js'
import { Script } from '../components/script.js'
import { resolveServiceRoute } from '../shop-route.js'
import { concat_words } from '@beenotung/tslib/string.js'
import { loadClientPlugin } from '../../client-plugin.js'
import { Router } from 'express'
import { createUploadForm } from '../upload.js'
import { HttpError } from '../../http-error.js'
import { join } from 'path'
import { Formidable } from 'formidable'
import { renameSync } from 'fs'

let pageTitle = 'Service Detail'
let addPageTitle = 'Add Service Detail'

let style = Style(/* css */ `
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
`)

function ServiceDetail(attrs: { service: Service }, context: DynamicContext) {
  let { service } = attrs
  let shop = service.shop!
  let shop_slug = shop!.slug
  let { slug: service_slug } = service
  let address = service.address || shop.address
  let address_remark = service.address_remark || shop.address_remark
  let options = filter(proxy.service_option, { service_id: service.id! })
  return (
    <>
      {style}
      <ion-header>
        <ion-toolbar color="primary">
          <IonBackButton
            href={'/shop/' + shop_slug}
            backText="其他畫班"
            color="light"
          />
          <ion-title role="heading" aria-level="1">
            {service.name}
          </ion-title>
          <ion-buttons slot="end">
            <Link
              tagName="ion-button"
              title="管理"
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
            ...getServiceImages(shop_slug, service_slug).map(url => (
              <img src={url} />
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
              <ion-icon name="time-outline"></ion-icon> 日期
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
    </>
  )
}

function ManageService(attrs: { service: Service }, context: DynamicContext) {
  let { service } = attrs
  let shop = service.shop!
  let shop_slug = shop!.slug
  let { slug: service_slug } = service
  let address = service.address || shop.address
  let address_remark = service.address_remark || shop.address_remark
  let options = filter(proxy.service_option, { service_id: service.id! })
  let uploadImageUrl = `/shop/${shop_slug}/service/${service_slug}/image`
  return (
    <>
      {style}
      <ion-header>
        <ion-toolbar color="primary">
          <IonBackButton href={'/shop/' + shop_slug} color="light" />
          <ion-title role="heading" aria-level="1">
            {concat_words('管理', service.name)}
          </ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content id="ServiceDetail" color="light">
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
        />
        <div class="text-center">
          <ion-button
            hidden
            id="uploadCoverImageButton"
            onclick="uploadCoverImage(this)"
            data-url={uploadImageUrl + '?name=cover'}
          >
            <ion-icon name="cloud-upload" slot="start"></ion-icon>
            Upload
          </ion-button>
        </div>
        {loadClientPlugin({ entryFile: 'dist/client/image.js' }).node}
        {loadClientPlugin({ entryFile: 'dist/client/sweetalert.js' }).node}
        {Script(/* javascript */ `
async function editCoverImage() {
  let image = await selectCoverImage()
  if (!image) return
  coverImage.src = image.dataUrl
  coverImage.file = image.file
  uploadCoverImageButton.hidden = false
  uploadCoverImageButton.textContent = 'Upload'
  uploadCoverImageButton.color = 'dark'
  uploadCoverImageButton.disabled = false
}
async function uploadCoverImage(button) {
  let file = coverImage.file
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
  uploadCoverImageButton.textContent = 'Uploaded'
  uploadCoverImageButton.color = 'success'
  uploadCoverImageButton.disabled = true
}
`)}
        <h2 class="ion-margin">Others</h2>
        <Swiper
          id="ServiceImages"
          images={[
            <img src={getServiceCoverImage(shop_slug, service_slug)} />,
            ...getServiceImages(shop_slug, service_slug).map(url => (
              <img src={url} />
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
              <ion-icon name="time-outline"></ion-icon> 日期
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
          query: { name },
        } = object({
          params: object({
            shop_slug: string({ nonEmpty: true }),
            service_slug: string({ nonEmpty: true }),
          }),
          query: object({ name: values(['cover']) }),
        }).parse(req)
        let shop = find(proxy.shop, { slug: shop_slug })
        if (!shop) throw new HttpError(404, 'shop not found')
        let service = find(proxy.service, {
          shop_id: shop.id!,
          slug: service_slug,
        })
        if (!service) throw new HttpError(404, 'service not found')
        let dir = join('public', 'assets', 'shops', shop_slug, service_slug)
        let filename = 'cover.webp'
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
      return resolveServiceRoute(context, (service, shop) => {
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
      return resolveServiceRoute(context, (service, shop) => {
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
