import { o } from '../jsx/jsx.js'
import { proxy } from '../../../db/proxy.js'
import Style from '../components/style.js'
import { Routes } from '../routes.js'
import { apiEndpointTitle, title } from '../../config.js'
import { getAuthUser, getAuthUserId } from '../auth/user.js'
import {
  Context,
  ExpressContext,
  getContextFormBody,
  resolveExpressContext,
} from '../context.js'
import { writeUserIdToCookie } from '../auth/user.js'
import { to_full_hk_mobile_phone } from '@beenotung/tslib'
import { EarlyTerminate, HttpError, MessageException } from '../../exception.js'
import { toRouteUrl } from '../../url.js'
import { Redirect } from '../components/router.js'
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

let host = new URL(env.ORIGIN).host

let createShopTitle = '商戶註冊'
let iconText = 'arrow-forward-circle-outline'

let style = Style(/* css */ `
#CreateShopPage2 h2 {
  font-size: 1.25rem;
}
#CreateShopPage2 .slug-input {
  height: 2rem;
  border-radius: 3rem;
  border: 0.0625rem solid #ddd;
  font-size: 1rem;
  --padding-start: 1rem;
  color: var(--ion-color-medium);
}
#CreateShopPage2 .slug-input .label-text-wrapper {
  margin-inline: 0 !important;
}
#CreateShopPage2 .slug-input .native-input {
  color: var(--ion-color-primary);
}
#CreateShopPage2 .slug-input ion-button {
  font-size: 1.25rem;
}
#CreateShopPage2 .hint {
  border-inline-start: 3px solid #748;
  background-color: #edf;
  padding: 1rem;
  margin: 0.5rem 0;
  width: fit-content;
}
#CreateShopPage2 form {
  height: calc(100% - 2rem);
  display: flex;
  flex-direction: column;
}
#CreateShopPage2 .form-body {
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
function CreateAccount(attrs: {}, context: Context) {
  let user = getAuthUser(context)

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
      <ion-content id="CreateShopPage2" class="ion-padding">
        <form
          method="POST"
          action={toRouteUrl(routes, '/on-board/account/submit')}
          onsubmit="uploadForm(event).then(handleMessageResponse)"
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

export function UserInsert(
  input: ParseResult<typeof SubmitAccountParser>,
  tel: string,
) {
  console.log(input.nickname)
  console.log(input.email)
  console.log(tel)
  let user_id = proxy.user.push({
    username: null,
    nickname: input.nickname,
    password_hash: null,
    email: input.email,
    tel,
    avatar: null,
    is_admin: false,
    is_creating_shop: true,
  })
  if (!user_id) {
    throw new HttpError(400, '未能成功登記，請重新嘗試')
  }
  console.log(user_id)
  return user_id
}

let SubmitAccountParser = object({
  nickname: string(),
  email: string(),
  tel: string(),
})

let submitParser = object({
  nickname: object({ 0: string() }),
  email: object({ 0: string() }),
  tel: object({ 0: string() }),
})

async function SubmitAccount(attrs: {}, context: ExpressContext) {
  try {
    let body = getContextFormBody(context)
    let form = new formidable.Formidable()
    let {} = await form.parse(context.req)
    console.log({ body })
    let input = SubmitAccountParser.parse(body, { name: 'req.body' })
    throw new Error('todo')
  } catch (error) {
    let message: ServerMessage = [
      'update-text',
      '#submitMessage',
      String(error),
    ]
    context.res.json({ message })
    throw EarlyTerminate
    // throw new MessageException(['update-text', '#submitMessage', String(error)])
  }
}

function SubmitAccount_1(attrs: {}, context: ExpressContext) {
  let body = getContextFormBody(context)
  let res = context.res
  let input: ParseResult<typeof SubmitAccountParser>
  let user_id: number | null = null
  try {
    input = SubmitAccountParser.parse(body, { name: 'req.body' })
  } catch (error) {
    let message = String(error)
    let match = message.match(
      /^TypeError: Invalid non-empty \w+ "req.body.(\w+)", got empty string$/,
    )
    console.log('match: ' + match)
    console.log('message: ' + message)
    if (match) {
      message = 'Missing ' + match[1]
    }
    console.log('33')
    console.log('message: ' + message)
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
  toRouteUrl(verificationCode.routes, '/user/verify/email/submit')
  try {
    console.log('6')
    user_id = UserInsert(input, tel)

    // console.log(context)
    // console.log(user_id)
    // console.log(context.res)
    writeUserIdToCookie(context.res, user_id)
    console.log('7')
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
      href={toRouteUrl(onBoardShopSlug.routes, '/on-board/shop-slug')}
    />
  )
}

function attachRoutes(app: Router) {
  app.post(
    '/on-board/account/submit' satisfies keyof typeof routes,
    async (req, res, next) => {
      try {
        let context = resolveExpressContext(req, res, next)
        let user = getAuthUser(context)
        if (!user) {
          throw new MessageException([
            'redirect',
            toRouteUrl(onBoard.routes, '/on-board'),
          ])
        }
        let form = new Formidable()
        let [fields] = await form.parse(req)
        let input = submitParser.parse(fields, { name: 'form fields' })
        console.log({ input })
        if (!input.nickname[0]) {
          throw 'missing nickname'
        }
        if (!input.email[0]) {
          throw 'missing email'
        }
        if (!input.tel[0]) {
          throw 'missing tel'
        }
        console.log('id:', user?.id)
        throw new MessageException(['redirect', '/123'])
      } catch (error) {
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
