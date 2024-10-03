import { o } from '../jsx/jsx.js'
import { mapArray } from '../components/fragment.js'
import { proxy, User } from '../../../db/proxy.js'
import Style from '../components/style.js'
import { Routes } from '../routes.js'
import { LayoutType, apiEndpointTitle, config, title } from '../../config.js'
import { getAuthUser, getAuthUserRole } from '../auth/user.js'
import {
  Context,
  DynamicContext,
  ExpressContext,
  getContextFormBody,
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
import { Input } from '../components/input.js';
import { Script } from '../components/script.js'
import onBoardAccount from './on-board-account.js'

let createShopTitle = '商戶註冊'
let iconText = "arrow-forward-circle-outline"
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

let ShopSlugParser = object({
  shop_slug: string({ nonEmpty: true, match: /^[\w-.]{1,32}$/ }),
})

let SubmitShopParser = object({
  nickname: string({ nonEmpty: true }),
  email: email({ nonEmpty: true }),
  tel: string({ nonEmpty: true }),
  shop_slug: string({ nonEmpty: true, match: /^[\w-.]{1,32}$/ }),
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


function CreateShopSlug(attrs: {}, context: Context) {
  let user = getAuthUser(context)
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
      <ion-content class="ion-padding">
        <form
          method="POST"
          action={toRouteUrl(routes, '/on-board/slug-check')}
          onsubmit="emitForm(event)"
        >
          
          <ion-item lines="none">
            <ion-input
              name="shop_slug"
              class="ion-padding"
              style="margin: auto 0"
              label={env.ORIGIN + '/shop/'}
              labelPlacement = 'start'
              placeholder="lab.on.the.balconi"
              
          >
            <ion-button 
              color="none"
              type="submit"
              slot="end"
              fill="clear"
              onmouseenter="this.querySelector('ion-icon').name = 'arrow-forward-circle'"
              onmouseleave="this.querySelector('ion-icon').name = 'arrow-forward-circle-outline'"
              >
              <ion-icon 
                fill="clear"
                class="arrowIcon"
                iconState='false'
                name='arrow-forward-circle-outline'
                >
              </ion-icon>
            </ion-button>
          </ion-input>
          </ion-item>
          <p id="submitMessage"></p>
        </form>
        
{Script(/* javascript */ `

`)}
      
      </ion-content>
    </>
  )
}


function OnBoardShopSlug(attrs: {}, context: DynamicContext){
  let body = getContextFormBody(context)
  let input: ParseResult<typeof ShopSlugParser>

  try {
    input = ShopSlugParser.parse(body, { name: 'req.body' })
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
  
  let shop_slug: string = input.shop_slug.toLowerCase()
  let check_show_slug_exists = db
    .prepare<{shop_slug: string}>(
    /* sql */ `
  select slug from shop
  where slug = :shop_slug
  limit 1
  `,
  )

  let queryResult: string | null
  try {
    queryResult = check_show_slug_exists.get({shop_slug}) as string
  } catch (error) {
    let message = String(error)
    // let match = message.match(
    //   /^SqliteError: UNIQUE constraint failed: ([\w.]+)$/,
    // )
    throw new MessageException(['update-text', '#submitMessage', message])
  }
  if (queryResult) {
    throw new MessageException(['update-text', '#submitMessage', shop_slug + ' 已經註冊了，不可重複使用'])
  }
  else {
    return (
      <>
        <Redirect
          href={toRouteUrl(onBoardAccount.routes, '/on-board/account')}
        />
      </>
    )
  }
  
}


function SubmitShop(attrs: {}, context: DynamicContext) {
  let user = getAuthUser(context)
  if (!user) {
    throw new MessageException([
      'update-text',
      '#submitMessage',
      'Only admin can create shop',
    ])
  }
  let body = getContextFormBody(context)
  let input: ParseResult<typeof SubmitShopParser>
  try {
    input = SubmitShopParser.parse(body, { name: 'req.body' })
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

let routes = {
  '/on-board': {
    title: title(createShopTitle),
    description: 'create shop slug',
    adminOnly: false,
    node: <CreateShopSlug />,
  },
  '/on-board/submit': {
    title: apiEndpointTitle,
    description: 'submit shop and merchant profile',  
    adminOnly: false,
    node: <SubmitShop />,
  },
  '/on-board/slug-check': {
    title: apiEndpointTitle,
    description: 'checking show slug',  
    adminOnly: false,
    node: <OnBoardShopSlug />,
  },
} satisfies Routes

export default { routes }

