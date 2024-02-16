import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { apiEndpointTitle, title } from '../../config.js'
import Style from '../components/style.js'
import {
  Context,
  DynamicContext,
  WsContext,
  getContextFormBody,
} from '../context.js'
import { mapArray } from '../components/fragment.js'
import { IonBackButton } from '../components/ion-back-button.js'
import { config } from '../../config.js'
import { object, string } from 'cast.ts'
import { Link, Redirect } from '../components/router.js'
import { renderError } from '../components/error.js'
import { getAuthUser } from '../auth/user.js'
import { wsStatus } from '../components/ws-status.js'
import { Shop, proxy } from '../../../db/proxy.js'
import { filter, find } from 'better-sqlite3-proxy'
import {
  getServiceCoverImage,
  getShopCoverImage,
  getShopLocale,
  getShopLogoImage,
} from '../shop-store.js'
import { Script } from '../components/script.js'
import { fitIonFooter, selectIonTab } from '../styles/mobile-style.js'
import { IonTabBar } from '../components/ion-tab-bar.js'
import { appIonTabBar } from '../components/app-tab-bar.js'

let pageTitle = 'The Balconi ARTLAB 香港'

let addPageTitle = 'Add more'

let style = Style(/* css */ `
#ShopHome {

}
ion-card
ion-thumbnail {
  --size: 12rem;
}
.card-text-container {
  margin-inline-start: 1rem;
  flex-grow: 1;
}
.card--field {
  display: flex;
  align-items: center;
}
.img-icon {
  max-width: 2.5rem;
  max-height: 2.5rem;
}
.img-icon--text {
  margin-inline-start: 1rem;
}
.social-media-buttons {
  flex-direction: column;
  align-items: start;
  gap: 0.75rem;
}
.social-media-buttons ion-button.md {
  width: auto !important;
  --border-radius: unset !important;
}
`)

function ShopHome(attrs: { shop: Shop }, context: DynamicContext) {
  let { shop } = attrs
  let { name, slug: shop_slug, owner_name } = shop
  let user = getAuthUser(context)
  let services = filter(proxy.service, { shop_id: shop.id! })
  let locale = getShopLocale(shop.id!)
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
          class="ion-margin"
          style="
            border-radius: 1rem;
            width: calc(100% - 2rem);
          "
          src={getShopCoverImage(shop_slug)}
        />
        <div class="ion-margin">
          <b>{shop.bio}</b>
          <p>{shop.desc}</p>
        </div>
        <h2 class="ion-margin">
          {/* {owner_name} {locale.service} */}
          Booking
        </h2>
        <ion-list>
          {mapArray(services, service => (
            <Link
              tagName="ion-card"
              href={`/shop/${shop.slug}/service/${service.slug}`}
            >
              <div class="d-flex">
                <div>
                  <ion-thumbnail>
                    <img src={getServiceCoverImage(shop_slug, service.slug)} />
                  </ion-thumbnail>
                </div>
                <div class="card-text-container">
                  <h3>{service.name}</h3>
                  <p class="card--field">
                    <ion-icon name="hourglass-outline" />
                    &nbsp;時長: {service.hours}
                  </p>
                  <p class="card--field">
                    <ion-icon name="cash-outline" />
                    &nbsp;費用:{' '}
                    {service.unit_price
                      ? '$' + service.unit_price + '/' + service.price_unit
                      : service.price_unit}
                  </p>
                  <ion-button size="small" color="primary" fill="block">
                    立即預約
                  </ion-button>
                </div>
              </div>
            </Link>
          ))}
        </ion-list>
        <h2 class="ion-margin">聯絡方法</h2>
        <ion-buttons class="social-media-buttons ion-margin">
          {mapArray(
            [
              {
                label: 'phone number',
                icon: 'phone.webp',
                prefix: 'tel:',
                slug: shop.tel,
                credit: 'Kreasi Kanvas on iconscout.com',
              },
              {
                label: 'email address',
                icon: 'gmail.webp',
                prefix: 'mailto:',
                slug: shop.email,
                credit: 'মুহম্মদ রাগিব হাসিন on wikipedia.org',
              },
              {
                label: 'street address',
                icon: 'google_map.webp',
                prefix: 'https://www.google.com/maps/search/',
                slug: shop.address,
                credit: 'Abdul Abid on iconscout.com',
              },
              {
                label: 'facebook contact',
                icon: 'Facebook_icon.svg',
                prefix: 'https://www.facebook.com/',
                slug: shop.facebook,
                credit: 'Tkgd2007 on wikipedia.org',
              },
              {
                label: 'messenger contact',
                icon: 'facebook_messenger.svg',
                prefix: 'https://m.me/',
                slug: shop.messenger,
                credit: 'Totie on wikipedia.org',
              },
              {
                label: 'instagram contact',
                icon: 'instagram.svg',
                prefix: 'https://www.instagram.com/',
                slug: shop.instagram,
                credit: 'diej4cob on wikipedia.org',
              },
              {
                label: 'youtube channel',
                icon: 'youtube.webp',
                prefix: 'https://www.youtube.com/@',
                slug: shop.youtube,
                credit: 'Pixel Icons on iconscout.com',
              },
              {
                label: 'whatsapp contact',
                icon: 'whatsapp.webp',
                prefix:
                  'https://wa.me/' + (shop.whatsapp?.length === 8 ? '852' : ''),
                slug: shop.whatsapp,
                credit: 'Icon Mafia on iconscout.com',
              },
              {
                label: 'telegram contact',
                icon: 'telegram.webp',
                prefix: 'https://t.me/',
                slug: shop.telegram,
                credit: 'Javitomad on wikipedia.org',
              },
              {
                label: 'twitter contact',
                icon: 'twitter.svg',
                prefix: 'https://twitter.com/',
                slug: shop.twitter,
                credit: 'Smasongarrison on wikipedia.org',
              },
            ],
            item =>
              item.slug ? (
                <ion-button href={item.prefix + item.slug} target="_blank">
                  <img
                    class="img-icon"
                    slot="icon-only"
                    src={'/assets/contact-methods/' + item.icon}
                    alt={'credit to ' + item.credit}
                    aria-hidden="true"
                  />
                  <span class="img-icon--text" title={item.label}>
                    {item.slug}
                  </span>
                </ion-button>
              ) : null,
          )}
        </ion-buttons>
        {wsStatus.safeArea}
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
