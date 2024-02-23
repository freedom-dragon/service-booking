import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { apiEndpointTitle, title } from '../../config.js'
import Style from '../components/style.js'
import { Context, DynamicContext, getContextFormBody } from '../context.js'
import { mapArray } from '../components/fragment.js'
import { IonBackButton } from '../components/ion-back-button.js'
import { object, string, optional } from 'cast.ts'
import { Link, Redirect } from '../components/router.js'
import { renderError } from '../components/error.js'
import { getAuthUser } from '../auth/user.js'
import { getShopContacts } from '../shop-store.js'
import { find } from 'better-sqlite3-proxy'
import { Shop, proxy } from '../../../db/proxy.js'
import { ShopContacts, ShopContactsStyle } from '../components/shop-contact.js'

let pageTitle = '商戶管理'
let addPageTitle = 'Add Shop Admin'

let style = Style(/* css */ `
#ShopAdmin {

}
`)

function ShopAdmin(attrs: { shop: Shop }) {
  let { shop } = attrs
  return (
    <>
      {style}
      {ShopContactsStyle}
      <ion-header>
        <ion-toolbar>
          <IonBackButton href="/app/more" backText="更多" />
          <ion-title role="heading" aria-level="1">
            {pageTitle}
          </ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content id="ShopAdmin" class="ion-padding" color="light">
        <ion-list-header>聯絡方法</ion-list-header>
        <ion-note color="dark">
          <div class="ion-margin-horizontal">
            這些聯繫方法會在商户主頁顯示。
          </div>
          <div class="ion-margin-horizontal">請提供至少一種類聯繫方法。</div>
        </ion-note>
        {mapArray(getShopContacts(shop), item => (
          <ion-list inset="true">
            <ion-item>
              <ion-input
                label={item.label}
                label-placement="floating"
                type={item.type}
                value={item.slug}
              />
            </ion-item>
            <div>
              <ion-note color="dark" class="ion-margin-horizontal">
                預覽
              </ion-note>
              {item.slug ? <ShopContacts items={[item]} /> : '(無)'}
            </div>
          </ion-list>
        ))}
      </ion-content>
    </>
  )
}

let addPage = (
  <>
    {Style(/* css */ `
#AddShopAdmin .hint {
  margin-inline-start: 1rem;
  margin-block: 0.25rem;
}
`)}
    <ion-header>
      <ion-toolbar>
        <IonBackButton href="/shop-admin" backText={pageTitle} />
        <ion-title role="heading" aria-level="1">
          {addPageTitle}
        </ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content id="AddShopAdmin" class="ion-padding">
      <form
        method="POST"
        action="/shop-admin/add/submit"
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
    return <Redirect href={`/shop-admin/result?id=${id}`} />
  } catch (error) {
    return (
      <Redirect
        href={
          '/shop-admin/result?' + new URLSearchParams({ error: String(error) })
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
          <IonBackButton href="/shop-admin/add" backText="Form" />
          <ion-title role="heading" aria-level="1">
            Submitted {pageTitle}
          </ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content id="AddShopAdmin" class="ion-padding">
        {error ? (
          renderError(error, context)
        ) : (
          <>
            <p>Your submission is received (#{id}).</p>
            <Link href="/shop-admin" tagName="ion-button">
              Back to {pageTitle}
            </Link>
          </>
        )}
      </ion-content>
    </>
  )
}

let routes: Routes = {
  '/shop/:slug/admin': {
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
        description: 'Admin page for ' + shop_name,
        node: <ShopAdmin shop={shop} />,
      }
    },
  },
  '/shop-admin/add': {
    title: title(addPageTitle),
    description: 'TODO',
    node: <AddPage />,
    streaming: false,
  },
  '/shop-admin/add/submit': {
    title: apiEndpointTitle,
    description: 'TODO',
    node: <Submit />,
    streaming: false,
  },
  '/shop-admin/result': {
    title: apiEndpointTitle,
    description: 'TODO',
    node: <SubmitResult />,
    streaming: false,
  },
}

export default { routes }
