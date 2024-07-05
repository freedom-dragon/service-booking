import { apiEndpointTitle, title } from '../../config.js'
import { Link, Redirect } from '../components/router.js'
import { DynamicContext, ExpressContext } from '../context.js'
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
import { loginRouteUrl } from './login.js'
import { HttpError } from '../../exception.js'

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

let profilePage = (
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
        <Main />
      </div>
    </ion-content>
  </>
)

function Main(attrs: {}, context: DynamicContext) {
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
              <ion-icon name="at-outline"></ion-icon> 頭像相片
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
        href="/logout"
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

function Logout(_attrs: {}, context: ExpressContext) {
  if (context.type !== 'express') {
    throw new HttpError(500, 'This API only supports express context')
  }
  eraseUserIdFromCookie(context.res)
  return <Redirect href={loginRouteUrl(context)} />
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
      let user_id = getAuthUserId({
        type: 'express',
        req,
        res,
        next,
        url: req.url,
      })
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
    description: `Manage your public profile and exclusive content`,
    menuText: 'Profile',
    userOnly: true,
    node: profilePage,
  },
  '/logout': {
    title: apiEndpointTitle,
    description: 'logout your account',
    streaming: false,
    node: <Logout />,
  },
} satisfies Routes

export default { routes, attachRoutes }
