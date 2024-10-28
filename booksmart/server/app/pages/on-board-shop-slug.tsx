import { o } from '../jsx/jsx.js'
import { mapArray } from '../components/fragment.js'
import { proxy, User } from '../../../db/proxy.js'
import Style from '../components/style.js'
import { Routes } from '../routes.js'
import { LayoutType, apiEndpointTitle, config, title } from '../../config.js'
import { getAuthUser, getAuthUserId, getAuthUserRole } from '../auth/user.js'
import {
  Context,
  DynamicContext,
  ExpressContext,
  getContextFormBody,
  WsContext,
} from '../context.js'
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
import { getContextCookies } from '../cookie.js'
import onBoardAccount from './on-board-account.js'
import onBoardShopProfile from './on-board-shop-profile.js'

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
  color: #68a1e2;
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
      color: #68a1e2;
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
#CreateShopPage h2 {
  font-size: 1.25rem;
}
#CreateShopPage .slug-input {
  height: 2rem;
  border-radius: 3rem;
  border: 0.0625rem solid #ddd;
  border-color: #68a1e2;
  font-size: 1rem;
  --padding-start: 1rem;
  color: var(--ion-color-medium);
}
#CreateShopPage .slug-input .label-text-wrapper {
  margin-inline: 0 !important;
}
#CreateShopPage .slug-input .native-input {
  color: var(--ion-color-primary);
}
#CreateShopPage .slug-input ion-button {
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

let slug_regex = /^[\w-._]{1,32}$/
let shop_slug_parser = string({ nonEmpty: true, match: slug_regex })

let CheckShopSlugParser = object({
  args: object({
    0: shop_slug_parser,
  }),
})

let SubmitShopParser = object({
  // nickname: string({ nonEmpty: true }),
  // email: email({ nonEmpty: true }),
  // tel: string({ nonEmpty: true }),
  slug: shop_slug_parser,
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

let script = Script(/* javascript */ `
  async function checkSlugInput(event) {
    let slug = event.target.value
    preview_url.textContent = '預覽: ${host}/shop/' + slug
  
    let url = event.target.closest('[data-check-url]').dataset.checkUrl
    emit(url, slug)
  }
  `)

function CreateShopSlug(attrs: {}, context: DynamicContext) {
  let user_id: number | null
  let user: User | null
  try {
    user_id = getAuthUserId(context)
    user = getAuthUser(context)
    if (user == null) {
      return (
        <Redirect
          href={toRouteUrl(onBoardAccount.routes, '/on-board/account')}
        />
      )
    }
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

  // console.log(user.nickname)
  // console.log(user.tel)
  // console.log(user.email)

  let SubmitAccountParser = object({
    nickname: string({ nonEmpty: true }),
    email: email({ nonEmpty: true }),
    tel: string({ nonEmpty: true }),
  })
  let input: ParseResult<typeof SubmitAccountParser>
  //input = SubmitAccountParser.parse(body, { name: 'req.body' })
  //console.log(input)
  //let fallback = roleCheck(user)
  //if (!user) return fallback
  return (
    <>
      {style}
      <ion-header>
        <ion-toolbar color="primary">
          <IonBackButton href={'/'} color="light" backText="Home" />
          <ion-title role="heading" aria-level="1">
            {createShopTitle}
          </ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding" id="CreateShopPage">
        <form
          method="POST"
          action={toRouteUrl(routes, '/on-board/shop-slug/submit')}
          //onsubmit="emitForm(event)"
        >
          <div class="form-body">
            <h2>選擇店舖連結</h2>
            <ion-item
              lines="none"
              style="margin-bottom: 0.5rem"
              data-check-url={toRouteUrl(
                routes,
                '/on-board/shop-slug/slug-check',
              )}
            >
              <ion-input
                class="slug-input"
                type="text"
                label={'/shop/'}
                oninput="checkSlugInput(event)"
                placeholder="my.shop.id"
                name="slug"
              >
                <ion-buttons slot="end">
                  <ion-button id="submitButton" disabled type="submit">
                    <ion-icon
                      id="submitButtonIcon"
                      name="arrow-forward-circle"
                    ></ion-icon>
                  </ion-button>
                </ion-buttons>
              </ion-input>
            </ion-item>
            <ion-note
              class="item--hint ion-text-center"
              id="preview_url"
              color="dark"
            >
              預覽: {host + '/shop/'}
            </ion-note>

            <p class="ion-text-center">
              <ion-text id="submitMessage"></ion-text>
            </p>
          </div>
        </form>

        {script}
      </ion-content>
    </>
  )
}

function OnBoardShopSlugCheck(attrs: {}, context: WsContext) {
  try {
    // let {
    //   args: { 0: slug },
    // } = CheckShopSlugParser.parse(context)
    let slug = (context.args?.[0] || '') as string
    let is_valid = slug && slug_regex.test(slug)
    let is_available = is_valid && count(proxy.shop, { slug }) == 0
    console.log({ slug })
    console.log({ is_available })
    console.log({ is_valid })
    let messages: ServerMessage[] = [
      ['update-props', '#submitButton', { disabled: !is_available }],
      [
        'update-props',
        '#submitButtonIcon',
        {
          name: is_available
            ? 'arrow-forward-circle'
            : 'arrow-forward-circle-outline',
        },
      ],
      [
        'update-text',
        '#submitMessage',
        !slug
          ? ''
          : is_available
            ? '這個 link 可以使用'
            : !is_valid
              ? '請輸入 1 至 32 個字元的店舖 link，只能包含英文字母、數字及符號「_」、「-」或「.」。例如：「my.dance.studio」'
              : '這個 link 已被使用（不可重複使用）',
      ],
      [
        'update-props',
        '#submitMessage',
        { color: is_available ? 'primary' : 'danger' },
      ],
    ]
    if (!is_available) {
      messages.push(['update-text', '#preview_url', ''])
    }
    throw new MessageException(['batch', messages])
  } catch (error) {
    if (error instanceof MessageException) {
      throw error
    }
    let message = String(error)
    throw new MessageException([
      'batch',
      [
        ['update-text', '#preview_url', ''],
        ['update-text', '#submitMessage', message],
        ['update-props', '#submitMessage', { color: 'danger' }],
      ],
    ])
  }

  // TODO
  return (
    <>
      <Redirect href={toRouteUrl(onBoard.routes, '/on-board')} />
    </>
  )
}

function SubmitShop(attrs: {}, context: DynamicContext) {
  let user_id = getAuthUserId(context)
  let user = getAuthUser(context)
  if (!user_id) {
    return (
      <Redirect href={toRouteUrl(onBoardAccount.routes, '/on-board/account')} />
    )
  }
  if (!user) {
    throw new MessageException([
      'update-text',
      '#submitMessage',
      'Only registered users can create shop',
    ])
  }
  let body = getContextFormBody(context)
  let input: ParseResult<typeof SubmitShopParser>
  try {
    input = SubmitShopParser.parse(body, { name: 'req.body' })
    console.log({ input })
    console.log(input.slug)
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
  if (!user.tel) {
    throw new MessageException([
      'update-text',
      '#submitMessage',
      'Invalid tel, please go back to the previous page to fill in hk telephone number',
    ])
  }
  let tel = to_full_hk_mobile_phone(user.tel)
  if (!tel) {
    throw new MessageException([
      'update-text',
      '#submitMessage',
      'Invalid tel, expect hk mobile phone number. Please go back to the previous page to fill it in.',
    ])
  }
  if (!user.nickname) {
    throw new MessageException([
      'update-text',
      '#submitMessage',
      'Invalid username, expected non-empty username string. Please go back to the previous page to fill it in.',
    ])
  }
  if (!user.email) {
    throw new MessageException([
      'update-text',
      '#submitMessage',
      'Invalid email, expected non-empty email string. Please go back to the previous page to fill it in.',
    ])
  }

  let name_email_parser = string({ nonEmpty: true })
  let nickname = name_email_parser.parse(user.nickname)
  let email = name_email_parser.parse(user.email)

  let insert_shop = db.transaction(() => {
    // let owner_id = proxy.user.push({
    //   username: null,
    //   nickname: input.nickname,
    //   password_hash: null,
    //   email: input.email,
    //   tel,
    //   avatar: null,
    //   is_admin: false,
    //   is_creating_shop: false,
    // })
    proxy.shop.push({
      owner_id: user_id,
      slug: input.slug,
      name: user.nickname + ' Shop',
      bio: null,
      desc: null,
      owner_name: nickname,
      address: null,
      address_remark: null,
      tel,
      email: email,
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
    console.log(proxy.shop)
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
      href={toRouteUrl(
        onBoardShopProfile.routes,
        '/on-board/:shop_slug/profile',
        {
          params: { shop_slug: input.slug },
        },
      )}
    />
  )
}

let routes = {
  '/on-board/shop-slug': {
    title: title(createShopTitle),
    description: 'create shop slug',
    adminOnly: false,
    node: <CreateShopSlug />,
  },
  '/on-board/shop-slug/submit': {
    title: apiEndpointTitle,
    description: 'submit shop and merchant profile',
    adminOnly: false,
    node: <SubmitShop />,
  },
  '/on-board/shop-slug/slug-check': {
    title: apiEndpointTitle,
    description: 'checking show slug',
    adminOnly: false,
    node: <OnBoardShopSlugCheck />,
  },
} satisfies Routes

export default { routes }
