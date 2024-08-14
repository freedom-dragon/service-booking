import { apiEndpointTitle, title } from '../../config.js'
import { Link, Redirect } from '../components/router.js'
import {
  Context,
  DynamicContext,
  ExpressContext,
  getContextFormBody,
} from '../context.js'
import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { User, proxy } from '../../../db/proxy.js'
import {
  eraseUserIdFromCookie,
  getAuthUser,
  getAuthUserRole,
} from '../auth/user.js'
import Style from '../components/style.js'
import { IonBackButton } from '../components/ion-back-button.js'
import { to_full_hk_mobile_phone } from '@beenotung/tslib/validate.js'
import login from './login.js'
import { HttpError, MessageException } from '../../exception.js'
import { toRouteUrl } from '../../url.js'
import { formatTel } from '../components/tel.js'
import Home from './home.js'
import { ParseResult, email, object, string } from 'cast.ts'
import { env } from '../../env.js'
import shopHome from './shop-home.js'
import { db } from '../../../db/db.js'
import { find } from 'better-sqlite3-proxy'
import { Node } from '../jsx/types.js'

let adminPortalTitle = 'Admin Portal'
let createShopTitle = '商戶註冊'

let style = Style(/* css */ `

`)

let adminProfilePage = (
  <>
    {style}
    <ion-header>
      <ion-toolbar color="primary">
        <IonBackButton href={toRouteUrl(Home.routes, '/')} color="light" />
        <ion-title role="heading" aria-level="1">
          {adminPortalTitle}
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

function roleCheck(user: User | null) {
  if (!user) {
    return (
      <div style="margin: 1rem">
        <p>正在以訪客身份瀏覽此頁。</p>
        <p>
          你可以
          <Link href={toRouteUrl(login.routes, '/admin/login')}>登入</Link>
          以管理店舖資料。
        </p>
      </div>
    )
  }
  if (!user.is_admin) {
    let role = find(proxy.shop, { owner_id: user.id! }) ? '商戶' : '用戶'
    return (
      <div style="margin: 1rem">
        <p>正在以{role}身份瀏覽此頁。</p>
        <p>
          你可以
          <a href={toRouteUrl(routes, '/admin/logout')}>登出</a>
          再切換至管理員以管理店舖資料。
        </p>
      </div>
    )
  }
}

function AdminProfileMain(attrs: {}, context: DynamicContext) {
  let user = getAuthUser(context)
  let fallback = roleCheck(user)
  if (!user || fallback) return fallback
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
            {createShopTitle}
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

function AdminCreateShopProfilePage(attrs: {}, context: Context) {
  let user = getAuthUser(context)
  let fallback = roleCheck(user)
  if (!user || fallback) return fallback
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
            {createShopTitle}
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
                label="商戶(聯絡人)暱稱"
                label-placement="floating"
                name="nickname"
              />
            </ion-item>
            <ion-item>
              <ion-input
                label="商戶(聯絡人)電郵"
                label-placement="floating"
                type="email"
                name="email"
              />
            </ion-item>
            <ion-item>
              <ion-input
                label="商戶(聯絡人)電話"
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
                oninput={`shopSlugPreview.innerText = '${env.ORIGIN + toRouteUrl(shopHome.routes, '/shop/:shop_slug', { params: { shop_slug: '' } })}' + this.value`}
              />
            </ion-item>
            <ion-note class="item--hint" id="shopSlugPreview">
              如: lab.on.the.balconi
            </ion-note>
          </ion-list>
          <ion-button
            type="submit"
            rel="nofollow"
            expand="block"
            class="ion-margin"
          >
            註冊商戶
          </ion-button>
          <p id="submitMessage"></p>
        </form>
      </ion-content>
    </>
  )
}

let adminSubmitShopParser = object({
  nickname: string({ nonEmpty: true }),
  email: email({ nonEmpty: true }),
  tel: string({ nonEmpty: true }),
  shop_slug: string({ nonEmpty: true, match: /^[\w-.]{1,32}$/ }),
})

function AdminSubmitShop(attrs: {}, context: DynamicContext) {
  let user = getAuthUser(context)
  if (!user?.is_admin) {
    throw new MessageException([
      'update-text',
      '#submitMessage',
      'Only admin can create shop',
    ])
  }
  let body = getContextFormBody(context)
  let input: ParseResult<typeof adminSubmitShopParser>
  try {
    input = adminSubmitShopParser.parse(body, { name: 'req.body' })
  } catch (error) {
    let message = String(error)
    let match = message.match(
      /^TypeError: Invalid non-empty \w+ "req.body.(\w+)", got empty string$/,
    )
    if (match) {
      message = 'Missing ' + match[1]
    }
    throw new MessageException(['update-text', '#submitMessage', message])
  }
  let tel = to_full_hk_mobile_phone(input.tel)
  if (!tel) {
    throw new MessageException([
      'update-text',
      '#submitMessage',
      'Invalid tel, expect hk mobile phone number',
    ])
  }
  let insert_shop = db.transaction(() => {
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
  })
  try {
    insert_shop()
  } catch (error) {
    let message = String(error)
    let match = message.match(
      /^SqliteError: UNIQUE constraint failed: ([\w.]+)$/,
    )
    if (match) {
      message = match[1] + ' 已經註冊了，不可重複使用'
    }
    throw new MessageException(['update-text', '#submitMessage', message])
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
    title: title(adminPortalTitle),
    description: `Manage shops for operation team`,
    menuText: 'Profile',
    adminOnly: true,
    node: adminProfilePage,
    menuFullNavigate: true,
  },
  '/admin/create-shop': {
    title: title(createShopTitle),
    description: 'create shop and merchant profile',
    adminOnly: true,
    node: <AdminCreateShopProfilePage />,
  },
  '/admin/create-shop/submit': {
    title: apiEndpointTitle,
    description: 'submit shop and merchant profile',
    adminOnly: true,
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
