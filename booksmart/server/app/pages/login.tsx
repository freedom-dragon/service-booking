import { LayoutType, apiEndpointTitle, config, title } from '../../config.js'
import { Link, Redirect } from '../components/router.js'
import { Context, DynamicContext, ExpressContext } from '../context.js'
import { o } from '../jsx/jsx.js'
import { Routes, StaticPageRoute } from '../routes.js'
import { getContextFormBody } from '../context.js'
import { renderError } from '../components/error.js'
import { proxy } from '../../../db/proxy.js'
import { find } from 'better-sqlite3-proxy'
import { getStringCasual } from '../context.js'
import { comparePassword } from '../../hash.js'
import { UserMessageInGuestView } from './profile.js'
import {
  getAuthUser,
  getAuthUserId,
  writeUserIdToCookie,
} from '../auth/user.js'
import Style from '../components/style.js'
import { IonBackButton } from '../components/ion-back-button.js'
import { wsStatus } from '../components/ws-status.js'
import { db } from '../../../db/db.js'
import { loadClientPlugin } from '../../client-plugin.js'
import { AppMoreBackButton } from './app-more.js'
import { toRouteUrl } from '../../url.js'
import shopHome from './shop-home.js'
import { getContextShopSlug } from '../auth/shop.js'

let style = Style(/* css */ `
#login .field {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
`)

let LoginPage = (
  <div id="login">
    {style}
    <h1>Login to {config.short_site_name}</h1>
    {/* <p>{commonTemplatePageText}</p> */}
    <Main />
  </div>
)
if (config.layout_type === LayoutType.ionic) {
  LoginPage = (
    <>
      {style}
      <Page />
    </>
  )
  let select_shop_id = db
    .prepare(
      /* sql */ `
select shop_id
from verification_code
where user_id = :user_id
  and match_id is not null
order by id desc
`,
    )
    .pluck()
  function Page(attrs: {}, context: Context) {
    let user = getAuthUser(context)
    let shop_id = user
      ? (select_shop_id.get({ user_id: user.id }) as number)
      : null
    let shop = shop_id ? proxy.shop[shop_id] : null
    return (
      <>
        <ion-header>
          <ion-toolbar color="primary">
            {shop ? (
              <IonBackButton
                href={toRouteUrl(shopHome.routes, '/shop/:shop_slug', {
                  params: { shop_slug: shop.slug },
                })}
                backText={'主頁'}
                color="light"
              />
            ) : (
              <AppMoreBackButton color="light" />
            )}
            <ion-title>登入</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div id="login">
            <h1>歡迎回到 {config.short_site_name}</h1>
            {/* <p>{commonTemplatePageText}</p> */}
            <Main />
          </div>
          {wsStatus.safeArea}
        </ion-content>
      </>
    )
  }
}

function Main(_attrs: {}, context: Context) {
  let user_id = getAuthUserId(context)
  return user_id ? <UserMessageInGuestView user_id={user_id} /> : guestView
}

let emailFormBody =
  config.layout_type !== LayoutType.ionic ? (
    <>
      <div class="field">
        <label>
          電郵地址
          <div class="input-container">
            <input name="email" type="email" autocomplete="email" />
          </div>
        </label>
      </div>
      <div class="field">
        <label>
          <input type="checkbox" name="include_link" /> 包括驗證連結
          （更方便但可能會被當作垃圾郵件）
        </label>
      </div>
      <input type="submit" value="發送驗證碼" />
    </>
  ) : (
    <>
      {loadClientPlugin({ entryFile: 'dist/client/sweetalert.js' }).node}
      <ion-list>
        <ion-item>
          <div slot="start">
            <ion-icon name="call-outline"></ion-icon> 電話
          </div>
          <ion-input type="tel" name="tel" autocomplete="tel" />
        </ion-item>
        <div class="ion-margin-horizontal" style="font-size: smaller">
          或者
        </div>
        <ion-item>
          <div slot="start">
            <ion-icon name="at-outline"></ion-icon> 電郵
          </div>
          <ion-input type="email" name="email" autocomplete="email" />
        </ion-item>
        <ion-item>
          <ion-checkbox name="include_link" slot="start"></ion-checkbox>
          <ion-label>包括驗證連結</ion-label>
        </ion-item>
        <ion-note color="dark">
          <div class="ion-padding-horizontal">
            （更方便但可能會被當作垃圾郵件）
          </div>
        </ion-note>
      </ion-list>
      <div class="ion-text-center ion-margin">
        <ion-button type="submit" fill="block" color="tertiary">
          發送驗證碼
        </ion-button>
      </div>
    </>
  )

let passwordFormBody =
  config.layout_type !== LayoutType.ionic ? (
    <>
      <label>
        Username or email address
        <div class="input-container">
          <input name="loginId" autocomplete="username" />
        </div>
      </label>
      <label>
        Password
        <div class="input-container">
          <input
            name="password"
            type="password"
            autocomplete="current-password"
          />
        </div>
      </label>
      <div class="input-container">
        <input type="submit" value="Login" />
      </div>
      <Message />
    </>
  ) : (
    <>
      <ion-list>
        <ion-item>
          <ion-input
            label="Username or email address"
            label-placement="floating"
            name="loginId"
            autocomplete="username"
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-input
            label="Password"
            label-placement="floating"
            name="password"
            type="password"
            autocomplete="current-password"
          ></ion-input>
        </ion-item>
      </ion-list>
      <div class="ion-text-center ion-margin">
        <ion-button type="submit" fill="block" color="primary">
          Login
        </ion-button>
      </div>
      <Message />
    </>
  )

let guestView = (
  <>
    <div hidden>Login with:</div>
    <form
      method="POST"
      action="/verify/email/submit"
      onsubmit="emitForm(event)"
    >
      {emailFormBody}
    </form>
    <div class="or-line flex-center" hidden>
      or
    </div>
    <form method="post" action="/login/submit" hidden>
      {passwordFormBody}
    </form>
    <div>首次使用{config.short_site_name}？您可以在提交預約時自動註冊。</div>
    <div hidden>
      New to {config.short_site_name}?{' '}
      <Link href="/register">Create an account</Link>.
    </div>
  </>
)

let codes: Record<string, string> = {
  not_found: 'user not found',
  no_pw: 'password is not set, did you use social login?',
  wrong: 'wrong username, email or password',
  ok: 'login successfully',
}

function Message(_attrs: {}, context: DynamicContext) {
  let code = new URLSearchParams(context.url.split('?').pop()).get('code')
  if (!code) return null
  return <p class="error">{codes[code] || code}</p>
}

async function submit(context: ExpressContext) {
  try {
    let body = getContextFormBody(context) || {}
    let loginId = getStringCasual(body, 'loginId')
    let password = getStringCasual(body, 'password')
    let user = find(
      proxy.user,
      loginId.includes('@') ? { email: loginId } : { username: loginId },
    )
    if (!user || !user.id) {
      return <Redirect href={loginRouteUrl(context, { code: 'not_found' })} />
    }

    let password_hash = user.password_hash
    if (!password_hash) {
      return <Redirect href={loginRouteUrl(context, { code: 'no_pw' })} />
    }

    let matched = await comparePassword({
      password,
      password_hash,
    })

    if (!matched) {
      return <Redirect href={loginRouteUrl(context, { code: 'wrong' })} />
    }

    writeUserIdToCookie(context.res, user.id)

    return <Redirect href={loginRouteUrl(context, { code: 'ok' })} />
  } catch (error) {
    return (
      <div>
        {renderError(error, context)}
        <Link href={loginRouteUrl(context)}>Try again</Link>
      </div>
    )
  }
}

export function loginRouteUrl(
  context: DynamicContext,
  query?: { code?: string },
) {
  let shop_slug = getContextShopSlug(context)
  return toRouteUrl(routes, '/shop/:shop_slug/login', {
    params: { shop_slug },
    query,
  })
}

export function LoginLink(attrs: {}, context: DynamicContext) {
  return <Link href={loginRouteUrl(context)}>Login</Link>
}

let routes = {
  '/shop/:shop_slug/login': {
    title: title('登入'),
    description: `Login to access exclusive content and functionality. Welcome back to our community on ${config.short_site_name}.`,
    menuText: 'Login',
    menuUrl: '/login',
    guestOnly: true,
    node: LoginPage,
  },
  '/login/submit': {
    streaming: false,
    async resolve(context: Context): Promise<StaticPageRoute> {
      return {
        title: apiEndpointTitle,
        description: `login existing account`,
        node: await submit(context as ExpressContext),
      }
    },
  },
} satisfies Routes

export default { routes }
