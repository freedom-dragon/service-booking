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
import { find } from 'better-sqlite3-proxy'
import { getServiceCoverImage } from '../shop-store.js'
import { Swiper } from '../components/swiper.js'

let pageTitle = 'Service Detail'
let addPageTitle = 'Add Service Detail'

let style = Style(/* css */ `
#ServiceDetail {

}
`)

function ServiceDetail(attrs: { service: Service }) {
  let { service } = attrs
  let shop_slug = service.shop!.slug
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
            <img src={getServiceCoverImage(shop_slug, service.id!)} />,
            <img src="https://picsum.photos/seed/1/512/512" />,
            <img src="https://picsum.photos/seed/2/512/512" />,
            <img src="https://picsum.photos/seed/3/512/512" />,
          ]}
          showPagination
        />
        <div class="ion-padding">
          Items
          <Main />
        </div>
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
  '/shop/:slug/service/:id': {
    resolve(context) {
      let slug = context.routerMatch?.params.slug
      let shop = find(proxy.shop, { slug })
      let id = context.routerMatch?.params.id
      let service = proxy.service[id]
      if (!service) {
        return {
          title: title('service not found'),
          description: 'The service is not found by id',
          node: <Redirect href={`/shop/${slug}`} />,
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
