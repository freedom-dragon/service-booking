import { LayoutType, apiEndpointTitle, config, title } from '../../config.js'
import { commonTemplatePageText } from '../components/common-template.js'
import { Link, Redirect } from '../components/router.js'
import Style from '../components/style.js'
import {
  Context,
  DynamicContext,
  getContextFormBody,
  getId,
  getStringCasual,
  resolveExpressContext,
  WsContext,
} from '../context.js'
import { EarlyTerminate, MessageException } from '../../exception.js'
import { o } from '../jsx/jsx.js'
import { proxy, Shop, User } from '../../../db/proxy.js'
import { Routes, StaticPageRoute } from '../routes.js'
import { getAuthUser, getAuthUserId } from '../auth/user.js'
import { IonBackButton } from '../components/ion-back-button.js'
import { toRouteUrl } from '../../url.js'
import { getContextShop } from '../auth/shop.js'
import { loadClientPlugin } from '../../client-plugin.js'
import Home from './home.js'
import onBoardShopSlug from './on-board-shop-slug.js'
import { Script } from '../components/script.js'
import {
  getShopContacts,
  getShopLogoImage,
  ShopContact,
} from '../shop-store.js'
import { object, ParseResult, string } from 'cast.ts'
import shopAdmin from './shop-admin.js'
import { mapArray } from '../components/fragment.js'
import home from './home.js'
import onBoardSocials from './on-board-socials.js'
import ShopHome from './shop-home.js'
import { env } from '../../env.js'
let shopCompleteTitle = '注冊完成'

let style = Style(/* css */ `
  .description {
    font-family: sans-serif;
    text-align: center;
    min-height: 1rem;
    font-size: 1rem;
    padding-bottom: 1.5rem;
    margin: 0 auto;
    color: #9c9c9c;
  }
  .title{
    font-family: 'Arial', sans-serif;
    text-align: center;
    margin: 16px auto;
    font-size: 1.5rem;
    font-weight: 400;
    line-height: 1.375;
    color: black;
  }
  .frame{
    border: 2px solid black;
    border-radius: 1rem;
    margin:0 auto;
    display: flex;
    justify-content: center;
    height: 60vh;
    width: 40vh;
    box-shadow: 3px 3px 10px 3px #aaaaaa;
  }
  .circle{
    width: 100vw;
    height: 100vh;
    border-radius: 13rem;
    background-color: #e6e6e6;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 1.75rem;
    margin-bottom: 1.75rem;
    cursor: pointer;
    overflow: hidden;
  }
  `)

let onBoardCompleteScript = (
  <>
    {loadClientPlugin({ entryFile: 'dist/client/sweetalert.js' }).node}
    {loadClientPlugin({ entryFile: 'dist/client/image.js' }).node}
    {Script(/* javascript */ `
    async function shareUrl(element) {
      
      try {
        let url = element.dataset.submitUrl
        console.log(url)
        const shareData = {
          title: "店鋪網址",
          text: "我在BookSmart創立了一間店鋪，大家一起來觀看吧！",
          url: "https://" + element.dataset.submitUrl,
        }
        await navigator.share(
          shareData
        )    
      } catch (error) {
        try {
          let url = element.dataset.submitUrl
          navigator.clipboard.writeText("我在BookSmart創立了一間店鋪，大家一起來觀看吧！ "+ url)
          showToast("Url successfully copied to clipboard.", "success")
          return
        } catch (err){
          console.log(err)
          showToast("Url failed to be shared.", "error")
        }
      }
    }
    `)}
  </>
)
function OnBoardComplete(attrs: {}, context: DynamicContext) {
  let user_id = getAuthUserId(context)
  let shop = getContextShop(context)
  let contacts = getShopContacts(shop)
  let shop_slug = shop.slug
  let host = new URL(env.ORIGIN).host
  let urlSuffix = toRouteUrl(ShopHome.routes, '/shop/:shop_slug', {
    params: { shop_slug },
  })
  let url = host + urlSuffix

  if (!shop) {
    return <Redirect href={toRouteUrl(Home.routes, '/')} />
  }
  if (shop.owner_id != user_id) {
    return <Redirect href={toRouteUrl(Home.routes, '/')} />
  }

  return (
    <>
      {style}
      <ion-header>
        <ion-toolbar color="primary">
          <IonBackButton
            href={toRouteUrl(
              onBoardSocials.routes,
              '/on-board/:shop_slug/socials',
              { params: { shop_slug } },
            )}
            color="light"
            backText="Admin"
          />
          <ion-title role="heading" aria-level="1">
            {shopCompleteTitle}
          </ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content id="OnBoardAccount" class="ion-padding">
        <div>
          <p class="title">Your site is now live!</p>
          <p class="description">
            Get more visitors by sharing your BookSmart shop everywhere
          </p>
        </div>
        <div>
          <iframe
            src={urlSuffix}
            name="targetframe"
            class="frame"
            allowTransparency="true"
            scrolling="no"
            frameborder="0"
          >
            <item class="circle"></item>
          </iframe>
        </div>

        <button onclick="shareUrl(this)" data-submit-url={url}>
          share testing
        </button>
        <text class="shareResult"></text>
        {onBoardCompleteScript}
      </ion-content>
    </>
  )
}
let routes = {
  '/on-board/:shop_slug/complete': {
    title: '成功開啓商戶帳號',
    description: `the completed screen of the shop creation`,
    adminOnly: false,
    node: <OnBoardComplete />,
  },
} satisfies Routes

export default { routes }
