import { apiEndpointTitle, title } from '../../config.js'
import { Link, Redirect } from '../components/router.js'
import {
  DynamicContext,
  ExpressContext,
  getContextFormBody,
} from '../context.js'
import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { proxy } from '../../../db/proxy.js'
import { eraseUserIdFromCookie, getAuthUser } from '../auth/user.js'
import Style from '../components/style.js'
import { IonBackButton } from '../components/ion-back-button.js'
import { to_full_hk_mobile_phone } from '@beenotung/tslib/validate.js'
import login from './login.js'
import { HttpError, MessageException } from '../../exception.js'
import { toRouteUrl } from '../../url.js'
import { formatTel } from '../components/tel.js'
import Home from './home.js'
import { email, object, string } from 'cast.ts'

let pageTitle = 'Admin Portal'

let style = Style(/* css */ `

`)

let adminProfilePage = (
  <>
    {style}
    <ion-header>
      <ion-toolbar color="primary">
        <IonBackButton href={toRouteUrl(Home.routes, '/')} color="light" />
        <ion-title role="heading" aria-level="1">
          {pageTitle}
        </ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div id="profile">
        <AdminProfileMain />
      </div>
    </ion-content>
  </>
)

function AdminProfileMain(attrs: {}, context: DynamicContext) {
  let user = getAuthUser(context)
  if (!user) {
    return (
      <>
        <p>正在以訪客身份瀏覽此頁。</p>
        <p>
          你可以
          <Link href={toRouteUrl(login.routes, '/admin/login')}>登入</Link>
          以管理店舖資料。
        </p>
      </>
    )
  }
  return (
    <>
      {Style(/* css */ `
#AdminProfile .field {
  margin: 1rem 0;
}
`)}
      <div style="padding: 1rem" id="AdminProfile">
        <h2>Admin Profile</h2>
        <div class="field">
          Email: <div>{user.email}</div>
        </div>
        <div class="field">
          Tel: <div>{user.tel ? formatTel(user.tel) : '-'}</div>
        </div>
        <div>
          <Link
            tagName="ion-button"
            href={toRouteUrl(routes, '/admin/create-shop')}
            expand="block"
            class="ion-margin"
            style="margin-top: 2rem"
          >
            Create Shop Profile
          </Link>
          <ion-button
            href={toRouteUrl(routes, '/admin/logout')}
            rel="nofollow"
            color="dark"
            expand="block"
            class="ion-margin"
          >
            登出
          </ion-button>
        </div>
      </div>
    </>
  )
}

function AdminCreateShopProfilePage() {
  return (
    <>
      {style}
      <ion-header>
        <ion-toolbar color="primary">
          <IonBackButton
            href={toRouteUrl(routes, '/admin/profile')}
            color="light"
            backText="Admin"
          />
          <ion-title role="heading" aria-level="1">
            Create Shop Profile
          </ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <form
          method="POST"
          action={toRouteUrl(routes, '/admin/create-shop/submit')}
          onsubmit="emitForm(event)"
        >
          <ion-list>
            <ion-item>
              <ion-input
                label="Merchant Nickname"
                label-placement="floating"
                name="nickname"
              />
            </ion-item>
            <ion-item>
              <ion-input
                label="Merchant Email"
                label-placement="floating"
                type="email"
                name="email"
              />
            </ion-item>
            <ion-item>
              <ion-input
                label="Merchant Tel"
                label-placement="floating"
                type="tel"
                name="tel"
              />
            </ion-item>
            <ion-item>
              <ion-input
                label="Shop Slug (in url)"
                label-placement="floating"
                name="shop_slug"
              />
            </ion-item>
          </ion-list>
          <ion-button
            type="submit"
            rel="nofollow"
            expand="block"
            class="ion-margin"
          >
            Submit
          </ion-button>
          <p id="submitMessage"></p>
        </form>
      </ion-content>
    </>
  )
}

let adminSubmitShopParser = object({
  email: email(),
  tel: string(),
  nickname: string(),
  shop_slug: string(),
})

function AdminSubmitShop(attrs: {}, context: DynamicContext) {
  let user = getAuthUser(context)
  console.log('user:', user?.is_admin)
  if (!user?.is_admin) {
    throw new MessageException([
      'update-text',
      '#submitMessage',
      'Only admin can create shop',
    ])
  }
  let body = getContextFormBody(context)
  let input = adminSubmitShopParser.parse(body, { name: 'req.body' })
  let tel = to_full_hk_mobile_phone(input.tel)
  if (!tel) {
    throw new MessageException([
      'update-text',
      '#submitMessage',
      'Invalid tel, expect hk mobile phone number',
    ])
  }
  try {
    let owner_id = proxy.user.push({
      username: null,
      nickname: input.nickname,
      password_hash: null,
      email: input.email,
      tel,
      avatar: null,
      is_admin: false,
    })
    proxy.shop.push({
      owner_id: owner_id,
      slug: input.shop_slug,
      name: input.nickname + ' Shop',
      bio: null,
      desc: null,
      owner_name: input.nickname,
      address: null,
      address_remark: null,
      tel,
      email: null,
      facebook: null,
      messenger: null,
      instagram: null,
      youtube: null,
      whatsapp: tel,
      telegram: null,
      twitter: null,
      floating_contact_method: 'whatsapp',
      payme_tel: null,
      payme_link: null,
      fps_tel: null,
      fps_email: null,
      fps_id: null,
      bank_name: null,
      bank_account_num: null,
      bank_account_name: null,
      accept_cash: true,
    })
  } catch (error) {
    throw new MessageException(['update-text', '#submitMessage', String(error)])
  }
  return (
    <Redirect
      href={toRouteUrl(login.routes, '/shop/:shop_slug/login', {
        params: { shop_slug: input.shop_slug },
      })}
    />
  )
}

function AdminLogout(_attrs: {}, context: ExpressContext) {
  if (context.type !== 'express') {
    throw new HttpError(500, 'This API only supports express context')
  }
  eraseUserIdFromCookie(context.res)
  return <Redirect href={toRouteUrl(login.routes, '/admin/login')} />
}

let routes = {
  '/admin/profile': {
    title: title(pageTitle),
    description: `Manage shops for operation team`,
    menuText: 'Profile',
    userOnly: true,
    node: adminProfilePage,
    menuFullNavigate: true,
  },
  '/admin/create-shop': {
    title: apiEndpointTitle,
    description: 'create shop profile',
    userOnly: true,
    node: <AdminCreateShopProfilePage />,
  },
  '/admin/create-shop/submit': {
    title: apiEndpointTitle,
    description: 'create shop profile',
    userOnly: true,
    node: <AdminSubmitShop />,
  },
  '/admin/logout': {
    title: apiEndpointTitle,
    description: 'logout your account',
    streaming: false,
    node: <AdminLogout />,
  },
} satisfies Routes

export default { routes }
