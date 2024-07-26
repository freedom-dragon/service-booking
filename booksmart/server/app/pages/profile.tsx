import { apiEndpointTitle, title } from '../../config.js'
import { Link, Redirect } from '../components/router.js'
import {
  DynamicContext,
  ExpressContext,
  getContextFormBody,
  resolveExpressContext,
} from '../context.js'
import { o } from '../jsx/jsx.js'
import { Routes, getContextSearchParams } from '../routes.js'
import { proxy } from '../../../db/proxy.js'
import {
  eraseUserIdFromCookie,
  getAuthUser,
  getAuthUserId,
} from '../auth/user.js'
import { Router } from 'express'
import { createUploadForm } from '../upload.js'
import Style from '../components/style.js'
import { renderError } from '../components/error.js'
import { Raw } from '../components/raw.js'
import { loadClientPlugin } from '../../client-plugin.js'
import { IonBackButton } from '../components/ion-back-button.js'
import { to_full_hk_mobile_phone } from '@beenotung/tslib/validate.js'
import { AppMoreBackButton } from './app-more.js'
import login, { loginRouteUrl } from './login.js'
import { HttpError, MessageException } from '../../exception.js'
import { toRouteUrl } from '../../url.js'
import { getContextShopSlug } from '../auth/shop.js'
import { formatTel } from '../components/tel.js'
import { Button } from '../components/button.js'
import Home from './home.js'
import { IonButton } from '../components/ion-button.js'
import { email, object, string } from 'cast.ts'
import shopAdmin from './shop-admin.js'

let pageTitle = '聯絡資料'

let style = Style(/* css */ `
#profile .avatar {
  width: 128px;
  height: 128px;
  border-radius: 100%;
  object-fit: cover;
}
#profile #previewImg {
  width: 160px;
  height: 160px;
  border-radius: 100%;
  object-fit: cover;
}
`)

let imagePlugin = loadClientPlugin({
  entryFile: 'dist/client/image.js',
})

let shopProfilePage = (
  <>
    <ion-header>
      <ion-toolbar color="primary">
        <AppMoreBackButton color="light" />
        <ion-title role="heading" aria-level="1">
          {pageTitle}
        </ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div id="profile">
        {style}
        <ShopMain />
      </div>
    </ion-content>
  </>
)

function ShopMain(attrs: {}, context: DynamicContext) {
  let shop_slug = getContextShopSlug(context)
  let user = getAuthUser(context)
  if (!user) {
    return (
      <>
        <p>正在以訪客身份瀏覽此頁。</p>
        <p>
          你可以<Link href={loginRouteUrl(context)}>登入</Link>
          以管理你的聯絡資料。
        </p>
      </>
    )
  }
  let params = getContextSearchParams(context)
  let error = params.get('error')
  return (
    <>
      <p>
        商家可以看到您的聯絡資料，包括您的頭像、名稱、電話號碼和電郵地址，以便了解你的需要和安排預約。
      </p>
      <form
        method="POST"
        action="/avatar"
        enctype="multipart/form-data"
        style="margin-bottom: 1rem"
      >
        <ion-list>
          <ion-item>
            <div slot="start">
              <ion-icon name="happy-outline"></ion-icon> 名稱
            </div>
            <ion-input name="nickname" value={user.nickname} />
          </ion-item>
          <ion-item>
            <div slot="start">
              <ion-icon name="call-outline"></ion-icon> 電話
            </div>
            <ion-input
              type="tel"
              name="tel"
              minlength="8"
              maxlength="8"
              value={user.tel?.replace('+852', '')}
            />
          </ion-item>
          <ion-item>
            <div slot="start">
              <ion-icon name="at-outline"></ion-icon> 電郵
            </div>
            <ion-input
              type="email"
              name="email"
              value={user.email}
              readonly
              disabled
            />
          </ion-item>
          <ion-item lines="none">
            <div slot="start">
              <ion-icon name="image-outline"></ion-icon> 頭像相片
            </div>
          </ion-item>
        </ion-list>
        <div
          class="ion-margin-horizontal d-flex w-100"
          style="
            justify-content: center;
            align-items: end;
          "
        >
          {user.avatar ? (
            <div>
              <img class="avatar" src={'/uploads/' + user.avatar} />
            </div>
          ) : (
            ' (none)'
          )}
          <ion-buttons>
            <ion-button onclick="fileInput.click()" title="更改頭像">
              <ion-icon name="create" slot="icon-only" />
            </ion-button>
          </ion-buttons>
        </div>
        <input
          hidden
          id="fileInput"
          type="file"
          name="avatar"
          accept="image/*"
          onchange="previewAvatar(this)"
        />
        <div id="previewContainer" hidden class="ion-margin-horizontal">
          <div id="previewMessage"></div>
          <div class="d-flex">
            <img id="previewImg" style="margin:auto" />
          </div>
        </div>
        {/* <input type="submit" value="上傳頭像" /> */}
        <ion-button expand="block" type="submit" class="ion-margin">
          更新資料
        </ion-button>
        {error ? renderError(error, context) : null}
        {Raw(/* html */ `
${imagePlugin.script}
<script>
async function previewAvatar(input) {
  let [image] = await compressPhotos(input.files)
  if (!image) return
  previewImg.src = image.dataUrl
  let kb = Math.ceil(image.file.size / 1024)
  previewMessage.textContent = '預覽 (' + kb + ' KB)'
  let list = new DataTransfer()
  list.items.add(image.file)
  input.files = list.files
  previewContainer.hidden = false
}
</script>
`)}
      </form>
      <ion-button
        href={toRouteUrl(routes, '/shop/:shop_slug/logout', {
          params: { shop_slug },
        })}
        rel="nofollow"
        color="dark"
        expand="block"
        class="ion-margin"
        style="margin-top: 2rem"
      >
        登出
      </ion-button>
    </>
  )
}

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
      tel: input.tel,
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
      tel: input.tel,
      email: input.email,
      facebook: null,
      messenger: null,
      instagram: null,
      youtube: null,
      whatsapp: input.tel,
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

function ShopLogout(_attrs: {}, context: ExpressContext) {
  if (context.type !== 'express') {
    throw new HttpError(500, 'This API only supports express context')
  }
  eraseUserIdFromCookie(context.res)
  return <Redirect href={loginRouteUrl(context)} />
}

function AdminLogout(_attrs: {}, context: ExpressContext) {
  if (context.type !== 'express') {
    throw new HttpError(500, 'This API only supports express context')
  }
  eraseUserIdFromCookie(context.res)
  return <Redirect href={toRouteUrl(login.routes, '/admin/login')} />
}

export function UserMessageInGuestView(attrs: { user_id: number }) {
  let user = proxy.user[attrs.user_id]
  return (
    <>
      <p>
        You have login as <b>{user.username || user.email}</b>.
      </p>
      <p>
        You can go to <Link href="/profile">profile page</Link> to manage your
        public profile and bookings.
      </p>
    </>
  )
}

function attachRoutes(app: Router) {
  app.post('/avatar', async (req, res, next) => {
    try {
      let context = resolveExpressContext(req, res, next)
      let user_id = getAuthUserId(context)
      if (!user_id) throw 'not login'

      let user = proxy.user[user_id]
      if (!user) throw 'user not found'

      let form = createUploadForm()
      let [fields, files] = await form.parse(req)

      let file = files.avatar?.[0]
      if (file) {
        user.avatar = file.newFilename
      }

      let nickname = fields.nickname?.[0] || ''
      let tel = fields.tel?.[0] || ''

      if (nickname && user.nickname != nickname) {
        user.nickname = nickname
      }

      if (tel) {
        tel = to_full_hk_mobile_phone(tel)
        if (!tel) {
          throw 'invalid phone number'
        }
        if (user.tel != tel) {
          user.tel = tel
        }
      }

      res.redirect('/profile')
    } catch (error) {
      if (typeof error !== 'string') {
        console.error(error)
      }
      res.redirect('/profile?' + new URLSearchParams({ error: String(error) }))
    }
  })
}

let routes = {
  '/shop/:shop_slug/profile': {
    title: title(pageTitle),
    description: `Manage your public profile for shops and consumers`,
    userOnly: true,
    node: shopProfilePage,
  },
  '/shop/:shop_slug/logout': {
    title: apiEndpointTitle,
    description: 'logout your account',
    streaming: false,
    node: <ShopLogout />,
  },
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

export default { routes, attachRoutes }
