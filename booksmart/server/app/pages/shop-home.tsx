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
import { wsStatus } from '../components/ws-status.js'
import { Shop, proxy } from '../../../db/proxy.js'
import { filter, find } from 'better-sqlite3-proxy'
import {
  getServiceCoverImage,
  getShopContacts,
  getShopCoverImage,
  getShopLocale,
  getShopLogoImage,
} from '../shop-store.js'
import { fitIonFooter, selectIonTab } from '../styles/mobile-style.js'
import { appIonTabBar } from '../components/app-tab-bar.js'
import { ShopContacts, ShopContactsStyle } from '../components/shop-contact.js'
import { countBooking } from '../booking-store.js'
import { EarlyTerminate, MessageException } from '../helpers.js'
import { getAuthRole } from '../auth/role.js'
import { loadClientPlugin } from '../../client-plugin.js'
import { randomUUID } from 'crypto'
import { serialize } from 'v8'
import { db } from '../../../db/db.js'

let pageTitle = 'The Balconi ARTLAB 香港'

let addPageTitle = 'Add more'

let style = Style(/* css */ `
#ShopHome {

}
.service--card:first-child {
  margin-top: 0;
}
ion-card
ion-thumbnail {
  --size: 12rem;
}
.card-text-container {
  margin-inline-start: 1rem;
  flex-grow: 1;
}
.card-text-container ion-button {
  margin-inline-end: 1rem;
}
.card--field {
  display: flex;
  align-items: center;
}

`)

let select_service = db.prepare<
  { shop_id: number; user_id: number | null },
  { id: number; timeslot_count: number | null }
>(/* sql */ `
select
  service.id
, count(service_timeslot.id) as timeslot_count
from service
left join service_timeslot on service_timeslot.service_id = service.id
inner join shop on shop.id = service.shop_id
where service.shop_id = :shop_id
  and service.archive_time is null
group by service.id
having (count(service_timeslot.id) > 0 or shop.owner_id = :user_id)
`)

function ShopHome(attrs: { shop: Shop }, context: DynamicContext) {
  let { shop } = attrs
  let { name, slug: shop_slug, owner_name } = shop
  let user = getAuthUser(context)
  let services = select_service.all({
    shop_id: shop.id!,
    user_id: user?.id || null,
  })
  let locale = getShopLocale(shop.id!)
  let contacts = getShopContacts(shop)
  let floating_contact = contacts.find(
    contact => contact.field == shop.floating_contact_method,
  )
  return (
    <>
      {style}
      <ion-header hidden>
        <ion-toolbar color="primary">
          <ion-title role="heading" aria-level="1">
            {name}
          </ion-title>
          <ion-buttons slot="end">
            {user ? (
              <Link tagName="ion-button" href="/shop-home/add">
                <ion-icon slot="icon-only" name="add"></ion-icon>
              </Link>
            ) : (
              <Link
                tagName="ion-button"
                title={'登入後可新增' + locale.service}
                href="/login"
              >
                <ion-icon slot="icon-only" name="person"></ion-icon>
              </Link>
            )}
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content id="ShopHome">
        <h1
          class="ion-margin"
          style="
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        "
        >
          <img
            style="
          max-width: 1.5em;
          max-height: 1.5em;
          border-radius: 0.2em;
        "
            src={getShopLogoImage(shop_slug)}
          />
          {name}
        </h1>
        <img
          class="ion-margin-horizontal"
          style="
          border-radius: 1rem;
          width: calc(100% - 2rem);
        "
          src={getShopCoverImage(shop_slug)}
        />

        <h2 class="ion-margin" style="margin-bottom: 0.5rem">
          {/* {owner_name} {locale.service} */}
          Booking
          {shop.owner_id == user?.id ? (
            <>
              <Link
                href={`/shop/${shop_slug}/add-service`}
                tagName="ion-button"
                style="margin-inline-start: 1rem"
                size="small"
              >
                新增服務
              </Link>
              {
                loadClientPlugin({ entryFile: 'dist/client/sweetalert.js' })
                  .node
              }
            </>
          ) : null}
        </h2>
        <ion-list>
          {mapArray(services, ({ id, timeslot_count }) => {
            let service = proxy.service[id]
            let { used, times } = countBooking({ service, user })
            return (
              <Link
                tagName="ion-card"
                href={`/shop/${shop.slug}/service/${service.slug}`}
                class="service--card"
              >
                <div class="d-flex">
                  <div>
                    <ion-thumbnail>
                      <img
                        src={getServiceCoverImage(shop_slug, service.slug)}
                      />
                    </ion-thumbnail>
                  </div>
                  <div class="card-text-container">
                    <h3>{service.name}</h3>
                    {times > 1 ? (
                      <p class="card--field">
                        <ion-icon name="copy-outline" />
                        &nbsp;次數:{' '}
                        {used ? (
                          <>
                            {used}/{times}
                          </>
                        ) : (
                          times
                        )}
                      </p>
                    ) : null}
                    {!timeslot_count ? (
                      <p class="card--field">
                        <ion-icon name="ban-outline" color="danger" />
                        &nbsp;未公開
                      </p>
                    ) : null}
                    <p class="card--field">
                      <ion-icon name="hourglass-outline" />
                      &nbsp;時長: {service.hours}
                    </p>
                    <p class="card--field">
                      <ion-icon name="cash-outline" />
                      &nbsp;費用:{' '}
                      {+service.unit_price!
                        ? '$' + service.unit_price + '/' + service.price_unit
                        : service.unit_price}
                    </p>
                    <ion-button size="small" color="primary" fill="block">
                      立即預約
                    </ion-button>
                  </div>
                </div>
              </Link>
            )
          })}
        </ion-list>

        <h2 class="ion-margin">關於我們</h2>
        <div class="ion-margin">
          <b>{shop.bio}</b>
          <p>{shop.desc}</p>
        </div>

        <h2 class="ion-margin">聯絡方法</h2>
        {ShopContactsStyle}
        <ShopContacts shop={shop} items={contacts} />

        {floating_contact ? (
          <ion-fab slot="fixed" vertical="bottom" horizontal="end">
            <ion-fab-button
              href={floating_contact.prefix + shop[floating_contact.field]}
              target="_blank"
            >
              <img src={'/assets/contact-methods/' + floating_contact.icon} />
            </ion-fab-button>
          </ion-fab>
        ) : null}
      </ion-content>
      <ion-footer>
        {appIonTabBar}
        {selectIonTab('home')}
      </ion-footer>
      {fitIonFooter}
    </>
  )
}

let addPage = (
  <>
    {Style(/* css */ `
#AddShopHome .hint {
  margin-inline-start: 1rem;
  margin-block: 0.25rem;
}
`)}
    <ion-header>
      <ion-toolbar>
        <IonBackButton href="/shop-home" backText={pageTitle} />
        <ion-title role="heading" aria-level="1">
          {addPageTitle}
        </ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content id="AddShopHome" class="ion-padding">
      <form
        method="POST"
        action="/shop-home/add/submit"
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
    // let id = items.push({
    //   title: input.title,
    //   slug: input.slug,
    // })
    let id = 1 // TODO
    return <Redirect href={`/shop-home/result?id=${id}`} />
  } catch (error) {
    return (
      <Redirect
        href={
          '/shop-home/result?' + new URLSearchParams({ error: String(error) })
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
          <IonBackButton href="/shop-home/add" backText="Form" />
          <ion-title role="heading" aria-level="1">
            Submitted {pageTitle}
          </ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content id="AddShopHome" class="ion-padding">
        {error ? (
          renderError(error, context)
        ) : (
          <>
            <p>Your submission is received (#{id}).</p>
            <Link href="/shop-home" tagName="ion-button">
              Back to {pageTitle}
            </Link>
          </>
        )}
      </ion-content>
    </>
  )
}

let addServiceParser = object({
  args: object({
    0: object({
      shop_slug: string(),
    }),
  }),
})
function AddService(attrs: { shop: Shop }, context: DynamicContext) {
  if (context.type != 'ws') {
    throw new Error('expect ws mode')
  }
  let { shop } = attrs
  let service_slug = randomUUID()
  let service_id = proxy.service.push({
    shop_id: shop.id!,
    slug: service_slug,
    name: '',
    times: null,
    hours: '',
    book_duration_minute: 120,
    unit_price: null,
    price_unit: '',
    time: '',
    quota: 6,
    address: null,
    address_remark: null,
    desc: null,
    archive_time: null,
  })
  throw new MessageException([
    'redirect',
    `/shop/${shop.slug}/service/${service_slug}/admin`,
  ])
}

let routes: Routes = {
  '/shop/:slug': {
    resolve(context) {
      let slug = context.routerMatch?.params.slug
      let shop = find(proxy.shop, { slug })
      if (!shop) {
        return {
          title: title('shop not found'),
          description: 'The shop is not found by slug',
          node: <Redirect href="/" />,
        }
      }
      let shop_name = shop.name
      return {
        title: title(shop_name),
        description: 'Booking page for ' + shop_name,
        node: <ShopHome shop={shop} />,
      }
    },
  },
  '/shop/:slug/add-service': {
    title: apiEndpointTitle,
    streaming: false,
    resolve(context) {
      let slug = context.routerMatch?.params.slug
      let shop = find(proxy.shop, { slug })
      if (!shop) {
        throw new MessageException([
          'eval',
          `showToast('shop not found', 'warning')`,
        ])
      }
      let role = getAuthRole(context)
      if (!role.user) {
        throw new MessageException([
          'batch',
          [
            [
              'eval',
              `showToast('login as shop owner to create service', 'warning')`,
            ],
            ['redirect', '/login'],
          ],
        ])
      }
      if (role.user.id != shop.owner_id) {
        throw new MessageException([
          'eval',
          `showToast('you're not the shop owner', 'warning')`,
        ])
      }
      return {
        title: apiEndpointTitle,
        description: 'Add new service by shop owner',
        node: <AddService shop={shop} />,
      }
    },
  },
  '/shop-home/add': {
    title: title(addPageTitle),
    description: 'TODO',
    node: <AddPage />,
    streaming: false,
  },
  '/shop-home/add/submit': {
    title: apiEndpointTitle,
    description: 'TODO',
    node: <Submit />,
    streaming: false,
  },
  '/shop-home/result': {
    title: apiEndpointTitle,
    description: 'TODO',
    node: <SubmitResult />,
    streaming: false,
  },
}

export default { routes }
