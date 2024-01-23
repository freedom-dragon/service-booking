import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { apiEndpointTitle, title } from '../../config.js'
import Style from '../components/style.js'
import { Context, DynamicContext, getContextFormBody } from '../context.js'
import { mapArray } from '../components/fragment.js'
import { IonBackButton } from '../components/ion-back-button.js'
import { config } from '../../config.js'
import { object, string } from 'cast.ts'
import { Link, Redirect } from '../components/router.js'
import { renderError } from '../components/error.js'
import { getAuthUser } from '../auth/user.js'
import { wsStatus } from '../components/ws-status.js'

let pageTitle = 'The Balconi ARTLAB 香港'

let locale = {
  tutor: '畫師',
  service: '畫班',
}
let data = {
  tutorName: 'Katy',
}

let addPageTitle = 'Add ' + locale.service

let style = Style(/* css */ `
#ShopHome {

}
`)

let page = (
  <>
    {style}
    <ion-header>
      <ion-toolbar color="primary">
        {/* <IonBackButton href="/" backText="Home" /> */}
        <ion-title role="heading" aria-level="1">
          {pageTitle}
        </ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content id="ShopHome" class="ion-padding">
      <Main />
      {wsStatus.safeArea}
    </ion-content>
  </>
)

let items = [
  {
    name: '體驗班',
    hours: '2 hours',
    price: '$380/位',
    time: '有指定可以book時間',
    options: ['正方形25cmx25cm', '長方形20cmx50cm', '圓形30cm直徑'],
    quota: '6 ppl',
  },
  {
    name: '舒壓花畫',
    hours: '2.5 - 3 hours',
    price: '$580/位',
    time: '有指定可以book時間',
    options: ['正方形25cmx25cm', '長方形20cmx50cm', '圓形30cm直徑'],
    quota: '6 ppl',
  },
  {
    name: '情侶班',
    hours: '3 - 3.5 hours',
    price: '$980/2位',
    time: '可任選時間',
    options: ['50x70cm'],
    quota: '2 pairs 情侶',
  },
  {
    name: '超大畫班',
    hours: '4 - 5 hours',
    price: '📐 量身訂做',
    time: '可任選時間',
    options: ['📐 量身訂做'],
    quota: '1 ppl',
  },
]

function Main(attrs: {}, context: Context) {
  let user = getAuthUser(context)

  return (
    <>
      <h2>
        {data.tutorName} {locale.service}
      </h2>
      <ion-list>
        {mapArray(items, item => (
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                {item.name} ({item.hours})
              </ion-card-title>
            </ion-card-header>
            <ion-list>
              <ion-item lines="none">
                <ion-label>Price: {item.price}</ion-label>
              </ion-item>
              <ion-item lines="none">
                <ion-label>Quota: {item.quota}</ion-label>
              </ion-item>
              <ion-item lines="none">
                <ion-label>Options:</ion-label>
              </ion-item>
              <div class="ion-margin-start">
                {mapArray(item.options, option => (
                  <ion-item lines="none">{option}</ion-item>
                ))}
              </div>
            </ion-list>
          </ion-card>
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
  '/shop-home': {
    title: title(pageTitle),
    description: 'TODO',
    menuText: pageTitle,
    menuFullNavigate: true,
    node: page,
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
