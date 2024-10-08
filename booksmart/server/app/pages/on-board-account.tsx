import { o } from '../jsx/jsx.js'
import { mapArray } from '../components/fragment.js'
import { proxy, User } from '../../../db/proxy.js'
import Style from '../components/style.js'
import { Routes, StaticPageRoute } from '../routes.js'
import { LayoutType, apiEndpointTitle, config, title } from '../../config.js'
import { getAuthUser, getAuthUserRole } from '../auth/user.js'
import {
  Context,
  DynamicContext,
  ExpressContext,
  getContextFormBody,
  WsContext,
} from '../context.js'
import { writeUserIdToCookie } from '../auth/user.js'
import { to_full_hk_mobile_phone } from '@beenotung/tslib'
import { db } from '../../../db/db.js'
import { HttpError, MessageException } from '../../exception.js'
import { toRouteUrl } from '../../url.js'
import { Link, Redirect } from '../components/router.js'
import { ParseResult, email, object, string } from 'cast.ts'
import { IonBackButton } from '../components/ion-back-button.js'
import { env } from '../../env.js'
import login from './login.js'
import shopHome from './shop-home.js'
import { Input } from '../components/input.js'
import { Script } from '../components/script.js'
import onBoard from './on-board.js'
import { ServerMessage } from '../../../client/types.js'
import { count } from 'better-sqlite3-proxy'
import onBoardShopSlug from './on-board-shop-slug.js'

let host = new URL(env.ORIGIN).host

let createShopTitle = '商戶註冊'
let iconText = 'arrow-forward-circle-outline'
let style = Style(/* css */ `
  /*
    .card-normal-text {
    font-size: 0.8rem;
    margin-bottom: 0.25rem;
    }

    ion-input.custom
    .rounded-input {
      text-size-adjust: auto;
      border-radius: 50px;
      padding: 10px;
      background-color: #fff;
      border: 1px solid #ddd;
      height: 40px;
    }
    
    .rounded-input::placeholder {
      color: #ccc;
    }
    
    .arrowIcon {
      text-size-adjust: auto;
      position: relative;
      font-size: 40px;
      left: 15px;
    }

    .ion-padding {
      text-size-adjust: auto;
      border-radius: 50px;
      padding: 1px;
      background-color: #fff;
      border: 1px solid #ddd;
      height: 60px;
      font-size: 30px;
    }

    ion-item > ion-label{
      flex: content;
    }

    ion-item div.label-text-wrapper.sc-ion-input-ios,
    ion-item div.label-text-wrapper.sc-ion-input-md {
      max-width: none;
      width: 400px;
    }

    ion-item div.label-text-wrapper div.label-text {
      text-overflow: unset;
      overflow: visible;
      margin-right: 0px;
      padding-right: 0px;
    }
*/
.card-normal-text {
  font-size: 0.8rem; /* Base font size */
  margin-bottom: 0.25rem;
}

.label-text-wrapper.sc-ion-input-ios{
    
}
ion-input.custom .rounded-input {
  text-size-adjust: auto;
  border-radius: 5rem; 
  background-color: #fff;
  border: 1px solid #ddd; 
  height: 3.5rem; 
}

ion-button {
  z-index = -1;
}
.rounded-input::placeholder {
  color: #ccc;
}

.arrowIcon {
  text-size-adjust: auto;
  position: relative;
  font-size: 2.5rem; 
  left: 0.93rem;
  background: transparent;
}

.text-input {
  text-align: left;
}

.ion-padding {
  height: 3.75rem;
  text-size-adjust: auto;
  padding: 0;
  border-radius: 3rem;
  background-color: #fff; /* placeholder*/
  border: 0.0625rem solid #ddd;
  font-size: 1.875rem;
}

span{
  vertical-align: middle;
}

ion-item > ion-label {
  flex: content;
}


ion-item div.label-text-wrapper.sc-ion-input-ios,
ion-item div.label-text-wrapper.sc-ion-input-md {
  max-width: none;
  width: 100%; /* Make it responsive */
}


ion-item div.label-text-wrapper div.label-text {
  text-overflow: unset;
  overflow: visible;
  margin-right: 0px;
  padding-right: 0px;
}

/* Media Queries for Responsive Design */
@media (max-width: 768px) {
  .card-normal-text {
      font-size: 0.7rem; /* Smaller text for mobile */
  }

  .ion-padding {
      height: 3rem; /* Relative height for mobile */
      font-size: 1.5rem; /* Smaller font size for mobile */
  }

  .arrowIcon {
      font-size: 2rem;
      text-size-adjust: auto;
      position: relative;
      background: transparent; /* Smaller arrow icon */
  }

  ion-input.custom .rounded-input {
      height: 2rem; /* Relative height for mobile */
  }
}
`)
style = Style(/* css */ `
h2 {
  font-size: 1.25rem;
}
.slug-input {
  height: 2rem;
  border-radius: 3rem;
  border: 0.0625rem solid #ddd;
  font-size: 1rem;
  --padding-start: 1rem;
  color: var(--ion-color-medium);
}
.slug-input .label-text-wrapper {
  margin-inline: 0 !important;
}
.slug-input .native-input {
  color: var(--ion-color-primary);
}
.slug-input ion-button {
  font-size: 1.25rem;
}
#CreateShopPage .hint {
  border-inline-start: 3px solid #748;
  background-color: #edf;
  padding: 1rem;
  margin: 0.5rem 0;
  width: fit-content;
}
#CreateShopPage form {
  height: calc(100% - 2rem);
  display: flex;
  flex-direction: column;
}
#CreateShopPage .form-body {
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

let SubmitAccountParser = object({
  nickname: string({ nonEmpty: true }),
  email: email({ nonEmpty: true }),
  tel: string({ nonEmpty: true }),
})

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
      <ion-content class="ion-padding">
        <form
          method="POST"
          action={toRouteUrl(routes, '/on-board/account/submit')}
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


function SubmitAccount(attrs: {}, context: DynamicContext ){
  let body = getContextFormBody(context)
  let res = (context as ExpressContext).res
  let input: ParseResult<typeof SubmitAccountParser>
  let user_id: number | null = null
  try {
    input = SubmitAccountParser.parse(body, { name: 'req.body' })
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
  
  try {
    let insert_shop = db.transaction(() => {
      user_id = proxy.user.push({
        username: null,
        nickname: input.nickname,
        password_hash: null,
        email: input.email,
        tel,
        avatar: null,
        is_admin: false,
        is_creating_shop: false,
      })
      
      
    })
    insert_shop()
    if (!user_id) {
      throw new HttpError(
        400,
        '未能成功登記，請重新嘗試',
      )
    }
    console.log(context)
    console.log(user_id)
    console.log(context as ExpressContext)
  writeUserIdToCookie(res, user_id)
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

let routes = {
  '/on-board/account': {
    resolve(context){
      return{
        title: title(createShopTitle),
        description: 'create account',
        adminOnly: false,
        node: <CreateAccount />,
      }
    }
    
  },
  '/on-board/account/submit': {
    streaming: false,
    resolve: context => SubmitAccount({}, context)
  },
} satisfies Routes

export default { routes }
