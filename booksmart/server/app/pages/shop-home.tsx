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
import { getServiceCoverImage, getShopLocale } from '../shop-store.js'

let pageTitle = 'The Balconi ARTLAB 香港'

let addPageTitle = 'Add more'

let style = Style(/* css */ `
#ShopHome {

}
ion-card
ion-thumbnail {
  --size: 8rem;
}
.card-text-container {
  margin-inline-start: 1rem;
}
`)

function ShopHome(attrs: { shop: Shop }, context: DynamicContext) {
  let { shop } = attrs
  let { name, slug, owner_name } = shop
  let user = getAuthUser(context)
  let services = filter(proxy.service, { shop_id: shop.id! })
  let locale = getShopLocale(shop.id!)
  return (
    <>
      {style}
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title role="heading" aria-level="1">
            {name}
          </ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content id="ShopHome" class="ion-padding">
        <h2>
          {owner_name} {locale.service}
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
                    <img src={getServiceCoverImage(slug, service.slug)} />
                  </ion-thumbnail>
                </div>
                <div class="card-text-container">
                  <h3>{service.name}</h3>
                  <p>{service.hours}</p>
                  <p>{service.price}</p>
                </div>
              </div>
            </Link>
          ))}
        </ion-list>
        {user ? (
          <Link href="/shop-home/add" tagName="ion-button">
            {addPageTitle}
          </Link>
        ) : (
          <p>
            <Link href="/login">登入</Link>後可新增{locale.service}
          </p>
        )}
        {wsStatus.safeArea}
      </ion-content>
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
