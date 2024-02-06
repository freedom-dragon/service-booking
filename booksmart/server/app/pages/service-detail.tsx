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
import { Service, proxy } from '../../../db/proxy.js'
import { filter, find } from 'better-sqlite3-proxy'
import { getServiceCoverImage, getServiceImages } from '../shop-store.js'
import { Swiper } from '../components/swiper.js'
import { wsStatus } from '../components/ws-status.js'
import { Script } from '../components/script.js'

let pageTitle = 'Service Detail'
let addPageTitle = 'Add Service Detail'

let style = Style(/* css */ `
#ServiceDetail {

}
#ServiceImages .swiper-slide img {
  width: 100vw;
  height: 100vw;
  object-fit: contain;
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

function ServiceDetail(attrs: { service: Service }) {
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
        </ion-toolbar>
      </ion-header>
      <ion-content id="ServiceDetail">
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
        <ion-list>
          <ion-item lines="none">
            <div slot="start">
              <ion-icon name="options-outline"></ion-icon> 款式
            </div>
          </ion-item>
          <div
            class="service-options ion-margin-horizontal flex-wrap"
            style="gap: 0.25rem"
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
          <ion-item lines="none">
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
          <ion-item lines="none">
            <div slot="start">
              <ion-icon name="hourglass-outline"></ion-icon> 時長
            </div>
            <ion-label>{service.hours}</ion-label>
          </ion-item>
          <ion-item lines="none">
            <div slot="start">
              <ion-icon name="time-outline"></ion-icon> 時間
            </div>
            <ion-label>{service.time}</ion-label>
          </ion-item>
          <ion-item lines="none">
            <div slot="start">
              <ion-icon name="cash-outline"></ion-icon> 費用
            </div>
            <ion-label>{service.price}</ion-label>
          </ion-item>
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
              lines="none"
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
          <ion-item lines="none">
            <div slot="start">
              <ion-icon name="options-outline"></ion-icon> 款式
            </div>
          </ion-item>
        </ion-list>

        <div class="ion-padding">
          Items
          <Main />
        </div>
        {wsStatus.safeArea}
      </ion-content>
    </>
  )
}

let items = [
  { title: 'Android', slug: 'md' },
  { title: 'iOS', slug: 'ios' },
]

function Main(attrs: {}, context: Context) {
  let user = getAuthUser(context)
  return (
    <>
      <ion-list>
        {mapArray(items, item => (
          <ion-item>
            {item.title} ({item.slug})
          </ion-item>
        ))}
      </ion-list>
      {user ? (
        <Link href="/service-detail/add" tagName="ion-button">
          {addPageTitle}
        </Link>
      ) : (
        <p>
          You can add service detail after{' '}
          <Link href="/register">register</Link>.
        </p>
      )}
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
    let id = items.push({
      title: input.title,
      slug: input.slug,
    })
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

let routes: Routes = {
  '/shop/:shop_slug/service/:service_slug': {
    resolve(context) {
      let { shop_slug, service_slug } = context.routerMatch?.params
      let shop = find(proxy.shop, { slug: shop_slug })
      if (!shop) {
        return {
          title: title('shop not found'),
          description: 'The shop is not found by slug',
          node: <Redirect href={`/`} />,
        }
      }
      let service = find(proxy.service, {
        shop_id: shop.id!,
        slug: service_slug,
      })
      if (!service) {
        return {
          title: title('service not found'),
          description: 'The service is not found by slug',
          node: <Redirect href={`/shop/${shop_slug}`} />,
        }
      }
      let service_name = service.name
      return {
        title: title(service_name + ' | ' + shop?.name),
        description: 'Detail page for ' + service_name,
        node: <ServiceDetail service={service} />,
      }
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

export default { routes }
