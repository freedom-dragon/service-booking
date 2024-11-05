import { o } from '../jsx/jsx.js'
import { proxy } from '../../../db/proxy.js'
import Style from '../components/style.js'
import { Routes } from '../routes.js'
import { apiEndpointTitle, title } from '../../config.js'
import { getAuthUser, getAuthUserId } from '../auth/user.js'
import {
  Context,
  DynamicContext,
  ExpressContext,
  getContextFormBody,
  resolveExpressContext,
} from '../context.js'
import { writeUserIdToCookie } from '../auth/user.js'
import { to_full_hk_mobile_phone } from '@beenotung/tslib'
import { EarlyTerminate, HttpError, MessageException } from '../../exception.js'
import { toRouteUrl } from '../../url.js'
import { Link, Redirect } from '../components/router.js'
import { ParseResult, email, object, string } from 'cast.ts'
import { IonBackButton } from '../components/ion-back-button.js'
import { env } from '../../env.js'
import onBoard from './on-board.js'
import { ServerMessage } from '../../../client/types.js'
import onBoardShopSlug from './on-board-shop-slug.js'
import verificationCode from './verification-code.js'
import formidable, { Formidable } from 'formidable'
import { renderError } from '../components/error.js'
import { Router } from 'express'
import { placeholderForAttachRoutes } from '../components/placeholder.js'
import { loginRouteUrl } from './login.js'

let host = new URL(env.ORIGIN).host

let createShopTitle = '商戶註冊'
let iconText = 'arrow-forward-circle-outline'

let style = Style(/* css */ `
#OnBoardAccount h2 {
  font-size: 1.25rem;
}
#OnBoardAccount .slug-input {
  height: 2rem;
  border-radius: 3rem;
  border: 0.0625rem solid #ddd;
  font-size: 1rem;
  --padding-start: 1rem;
  color: var(--ion-color-medium);
}
#OnBoardAccount .slug-input .label-text-wrapper {
  margin-inline: 0 !important;
}
#OnBoardAccount .slug-input .native-input {
  color: var(--ion-color-primary);
}
#OnBoardAccount .slug-input ion-button {
  font-size: 1.25rem;
}
#OnBoardAccount .hint {
  border-inline-start: 3px solid #748;
  background-color: #edf;
  padding: 1rem;
  margin: 0.5rem 0;
  width: fit-content;
}
#OnBoardAccount form {
  height: calc(100% - 2rem);
  display: flex;
  flex-direction: column;
}
#OnBoardAccount .form-body {
  margin: auto;
}
`)

// let slug_regex = /^[\w-._]{1,32}$/
// let shop_slug_parser = string({ nonEmpty: true, match: slug_regex })

// let CheckShopSlugParser = object({
//   args: object({
//     0: shop_slug_parser,
//   }),
// })

/*
function roleCheck(user: User | null) {
  console.log(user)
  if (!user) {
    return (
      <div style="margin: 1rem">
        <p>正在以訪客身份瀏覽此頁。</p>
        <p>
          你可以
          <Link href={toRouteUrl(login.routes, '/admin/login')}>登入</Link>
          以設置店舖資料。
        </p>
      </div>
    )
  }
}
*/
function CreateAccount(attrs: {}, context: DynamicContext) {
  let user = getAuthUser(context)
  if (!user) {
    return (
      // <>
      //   <p>正在以訪客身份瀏覽此頁。</p>
      //   <p>
      //     你可以<Link href={loginRouteUrl(context)}>登入</Link>
      //     以管理你的聯絡資料。
      //   </p>
      // </>
      <Redirect href={toRouteUrl(onBoard.routes, '/on-board')} />
    )
  }

  //console.log(context);
  //let fallback = roleCheck(user)
  //if (!user) return fallback
  return (
    <>
      {style}
      <ion-header>
        <ion-toolbar color="primary">
          <IonBackButton
            href={toRouteUrl(onBoard.routes, '/on-board')}
            color="light"
            backText="Admin"
          />
          <ion-title role="heading" aria-level="1">
            {createShopTitle}
          </ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content id="OnBoardAccount" class="ion-padding">
        <form
          method="POST"
          action={toRouteUrl(routes, '/on-board/account/submit')}
          onsubmit="uploadForm(event).then(handleMessageResponse)"
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
            {/* <ion-item>
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
            </ion-item> */}
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

let submitParser = object({
  nickname: object({ 0: string() }),
  tel: object({ 0: string() }),
})

function attachRoutes(app: Router) {
  app.post(
    '/on-board/account/submit' satisfies keyof typeof routes,
    async (req, res, next) => {
      try {
        let context = resolveExpressContext(req, res, next)
        let user_id = getAuthUserId(context)
        if (!user_id) throw 'not login'
        let user = proxy.user[user_id]
        if (!user) {
          throw new MessageException([
            'redirect',
            toRouteUrl(onBoard.routes, '/on-board'),
          ])
        }
        // console.log(user.nickname)
        // console.log(user.tel?.replace('+852', ''))
        // console.log(user.tel)

        let email = user.email
        let form = new Formidable()
        let [fields] = await form.parse(req)
        let input = submitParser.parse(fields, { name: 'form fields' })
        console.log({ input })
        if (!input.nickname[0]) {
          throw 'missing nickname'
        }
        if (!email) {
          throw 'missing email'
        }
        if (!input.tel[0]) {
          throw 'missing tel'
        }
        let tel = to_full_hk_mobile_phone(input.tel[0])
        if (!tel) {
          throw new MessageException([
            'update-text',
            '#submitMessage',
            'Invalid tel, expect hk mobile phone number',
          ])
        }
        console.log('id:' + user?.id)
        user.nickname = input.nickname[0]
        user.tel = tel
        //let user_id = UserInsert(input.nickname[0], tel, email)

        writeUserIdToCookie(context.res, user_id)
        throw new MessageException(['redirect', '/on-board/shop-slug'])
      } catch (error) {
        let messageError = String(error)
        let match = messageError.match(
          /^SqliteError: UNIQUE constraint failed: ([\w.]+)$/,
        )
        if (match) {
          messageError = match[1] + ' 已經註冊了，不可重複使用'
          throw new MessageException([
            'update-text',
            '#submitMessage',
            messageError,
          ])
        }
        if (error instanceof MessageException) {
          res.json({ message: error.message })
          return
        }
        res.status(400)
        let message: ServerMessage = [
          'update-text',
          '#submitMessage',
          String(error),
        ]
        res.json({ message })
      }
    },
  )
}

let routes = {
  '/on-board/account': {
    resolve(context) {
      return {
        title: title(createShopTitle),
        description: 'create account',
        adminOnly: false,
        node: <CreateAccount />,
      }
    },
  },
  '/on-board/account/submit': placeholderForAttachRoutes,
} satisfies Routes

export default { routes, attachRoutes }
