import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { apiEndpointTitle, title } from '../../config.js'
import Style from '../components/style.js'
import { DynamicContext } from '../context.js'
import { mapArray } from '../components/fragment.js'
import { Link } from '../components/router.js'
import { getAuthUser } from '../auth/user.js'
import { Shop, proxy } from '../../../db/proxy.js'
import { find } from 'better-sqlite3-proxy'
import {
  countUserTicket,
  getServiceCoverImage,
  getShopContacts,
  getShopCoverImage,
  getShopLocale,
  getShopLogoImage,
} from '../shop-store.js'
import { fitIonFooter, selectIonTab } from '../styles/mobile-style.js'
import { AppTabBar } from '../components/app-tab-bar.js'
import { ShopContacts, ShopContactsStyle } from '../components/shop-contact.js'
import { countBooking } from '../booking-store.js'
import { MessageException } from '../../exception.js'
import { getAuthRole } from '../auth/role.js'
import { loadClientPlugin } from '../../client-plugin.js'
import { randomUUID } from 'crypto'
import { db } from '../../../db/db.js'
import { formatPrice } from '../format/price.js'
import { formatServiceDuration } from '../format/duration.js'
import { getContextShop } from '../auth/shop.js'
import { loginRouteUrl } from './login.js'
import { toRouteUrl } from '../../url.js'
import { Script } from '../components/script.js'

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
  margin-top: auto;
  margin-bottom: auto;
}
.card-text-container ion-button {
  margin-inline-end: 1rem;
}
.card-text {
  margin-top: 0px;
}
.card--field {
  display: flex;
  align-items: center;
}
.thumbnail-size {

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
  let { name, slug: shop_slug } = shop
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
  let booking_banner_radius!: string | null

  // console.log('background_color: ', background_color)
  console.log('font_family: ', shop.font_family)
  console.log('top_banner: ', shop.top_banner)
  console.log('booking_banner: ', shop.booking_banner)
  if (shop.booking_banner === 1) {
    booking_banner_radius = '2rem'
  } else if (shop.booking_banner === 2) {
    booking_banner_radius = '2rem'
  } else if (shop.booking_banner === 3) {
    booking_banner_radius = '0rem 2rem 2rem 0rem'
  }
  let theme = {
    // title: '#f005',
    background_color: shop.background_color,
    font_family: shop.font_family,
    top_banner: shop.top_banner,
    booking_banner: booking_banner_radius,
  }

  let loadUserStyle = Style(/* css */ `
    h2 {
      color: #fff;
    }
    #add-service-button {
      --background: #fff !important;
      color: ${theme.background_color}; 
    }
    #ShopHome {
      background-color: ${theme.background_color};
      --background: ${theme.background_color};
      font-family: ${theme.font_family};
    }
    
    .ion-list--style {
      background: ${theme.background_color};
    }
    ion-button {
      --background: ${theme.background_color} !important;
    }
    .social-media-buttons .img-icon--text {
      font-family: ${theme.font_family};
    }
    .service--card{
      border-radius: ${theme.booking_banner};
    }
    .circle{
      width: 10rem;
      height: 10rem;
      border-radius: 13rem;
      background-color: #e6e6e6;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 1.75rem;
      margin-bottom: 1.75rem;
      cursor: pointer;
      overflow: hidden;
      max-height: 15vh;
      max-width: 15vh;
      position: relative;
      bottom: 8.8vh;

    }
    
    
  `)
  let loadDefaultStyle = Style(/* css */ `
    .field-button {
      --background: var(--ion-color-primary) !important;
    }
    `)
  return (
    <>
      {style}
      {loadUserStyle}
      {theme.background_color === null ? loadDefaultStyle : null}

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
                href={loginRouteUrl(context)}
              >
                <ion-icon slot="icon-only" name="person"></ion-icon>
              </Link>
            )}
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content id="ShopHome">
        <ShopTopBanner shop={shop} />
        <h2
          class="ion-margin"
          style="
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
          "
        >
          {/* {owner_name} {locale.service} */}
          {/* Booking */}
          <span style="vertical-align: middle">立即預約</span>
          {shop.owner_id == user?.id ? (
            <>
              <Link
                href={toRouteUrl(routes, '/shop/:shop_slug/add-service', {
                  params: { shop_slug },
                })}
                tagName="ion-button"
                id="add-service-button"
                style="
                  margin-inline-start: 1rem;
                  margin-top: auto;
                  margin-bottom: auto;
                "
                size="small"
              >
                新增{locale.service}
              </Link>
              {
                loadClientPlugin({ entryFile: 'dist/client/sweetalert.js' })
                  .node
              }
            </>
          ) : null}
        </h2>
        {services.length == 0 ? (
          <p class="ion-margin-horizontal">未有{locale.service}</p>
        ) : null}
        <ion-list class="ion-list--style">
          {mapArray(services, ({ id, timeslot_count }) => {
            let service = proxy.service[id]
            let { used, times } = countBooking({ service, user })
            let user_ticket_count = countUserTicket({
              user_id: user?.id,
              service_id: service.id!,
            })
            return (
              <Link
                tagName="ion-card"
                href={`/shop/${shop.slug}/service/${service.slug}`}
                class="service--card"
              >
                <div class="d-flex">
                  <div class="thumbnail-size">
                    <ion-thumbnail>
                      <img
                        src={getServiceCoverImage(shop_slug, service.slug)}
                      />
                    </ion-thumbnail>
                  </div>
                  <div class="card-text-container">
                    <h3 class="card-text">{service.name}</h3>
                    {user_ticket_count > 0 ? (
                      <ion-badge>有套票</ion-badge>
                    ) : times > 1 ? (
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
                      &nbsp;時長: {formatServiceDuration(service)}
                    </p>
                    {service.original_price ? (
                      <p
                        class="card--field"
                        style="text-decoration: line-through"
                      >
                        <ion-icon name="cash-outline" />
                        &nbsp;原價:{' '}
                        {+service.original_price
                          ? '$' + service.original_price
                          : service.original_price}
                      </p>
                    ) : null}
                    <p class="card--field">
                      <ion-icon name="cash-outline" />
                      &nbsp;費用:{' '}
                      {+service.unit_price!
                        ? '$' + service.unit_price + '/' + service.price_unit
                        : service.unit_price}
                    </p>
                    {service.peer_amount && service.peer_price ? (
                      <p class="card--field">
                        {service.peer_amount}
                        人同行，每人{formatPrice(service.peer_price)}
                      </p>
                    ) : null}
                    <ion-button
                      class="field-button"
                      size="small"
                      color="primary"
                      fill="block"
                    >
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

        <div class="ion-text-center">
          <img
            src="/assets/powered-by-BookSmart.webp"
            style="max-width: 8rem; margin: 1rem"
          />
        </div>
      </ion-content>
      <ion-footer>
        <AppTabBar />
        {selectIonTab('home')}
      </ion-footer>
      {fitIonFooter}
    </>
  )
}

export function ShopTopBanner(attrs: { shop: Shop }, context: DynamicContext) {
  let shop = attrs.shop
  let { name, slug: shop_slug } = shop
  if (shop.top_banner === 1) {
    return (
      <>
        <img
          class="shop-logo"
          style="display: flex; justify-content: center; margin: 0.5rem auto 0;"
          src={getShopLogoImage(shop_slug)}
        />

        <h1
          class="ion-margin"
          style="
            display: flex;
            gap: 0.5rem;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            margin-top: 0.2rem;
          "
        >
          {name}
        </h1>
        <img
          class="ion-margin-horizontal shop-cover-image"
          src={getShopCoverImage(shop_slug)}
        />
      </>
    )
  } else if (shop.top_banner === 2) {
    return (
      <>
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
          <img class="shop-logo" src={getShopLogoImage(shop.slug)} />
          {name}
        </h1>
        <div
          class="ion-margin-horizontal shop-cover-image"
          style="width: 100vw"
        ></div>
        <img src={getShopCoverImage(shop_slug)} />
        <img src={getShopCoverImage(shop_slug)} />
      </>
    )
  } else if (shop.top_banner === 3) {
    return (
      <>
        <h1
          class="ion-margin"
          style="
            display: flex;
            gap: 0.5rem;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            margin-top: 0.2rem;
          "
        >
          {name}
        </h1>
        <img
          class="shop-cover-image"
          style="width: 100%"
          src={getShopCoverImage(shop_slug)}
        />
        <img
          class="shop-cover-image shop-logo circle"
          style="display: flex; justify-content: center; margin: 0.5rem auto -4rem;"
          src={getShopLogoImage(shop_slug)}
        />
      </>
    )
  } else {
    return (
      <>
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
          <img class="shop-logo" src={getShopLogoImage(shop.slug)} />
          {name}
        </h1>
        <img
          class="ion-margin-horizontal shop-cover-image"
          src={getShopCoverImage(shop_slug)}
        />
      </>
    )
  }
}
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
    book_duration_minute: 120,
    original_price: null,
    unit_price: null,
    price_unit: '',
    peer_amount: null,
    peer_price: null,
    time: '',
    quota: 6,
    address: null,
    address_remark: null,
    desc: null,
    archive_time: null,
    timeslot_interval_minute: null,
  })
  throw new MessageException([
    'redirect',
    `/shop/${shop.slug}/service/${service_slug}/admin`,
  ])
}

let routes = {
  '/shop/:shop_slug': {
    resolve(context) {
      let shop = getContextShop(context)
      let shop_name = shop.name
      return {
        title: title(shop_name),
        description: 'Booking page for ' + shop_name,
        node: <ShopHome shop={shop} />,
      }
    },
  },
  '/shop/:shop_slug/add-service': {
    title: apiEndpointTitle,
    streaming: false,
    resolve(context) {
      let slug = context.routerMatch?.params.shop_slug
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
            ['redirect', loginRouteUrl(context)],
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
} satisfies Routes

export default { routes }
