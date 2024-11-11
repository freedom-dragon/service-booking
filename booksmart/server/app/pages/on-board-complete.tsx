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

  .content{
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    flex-flow: column wrap-reverse;
  }
  .content :nth-child(1) { 
    order: 1; 
  }
  .content :nth-child(2) { 
    order: 2; 
  }
  .content :nth-child(3) { 
    order: 3; 
  }
  #OnBoardComplete{
    display: flex;
    flex-wrap : wrap;
    flex-direction: row-reverse;
    flex-flow: column wrap-reverse;
  }
  .box{
    flex: 1;
  }

  .description {
    width:40vw;
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

  .button-container{
    display: flex;
    justify-content: center;
  }
  .buttons{
    font-size: 1rem;
    width: 40vw;
    height: 3rem;
    padding: none;
    border-radius: 0.5rem;
    background-color: var(--ion-color-primary);
    color: white;
    cursor: pointer;
    margin: 3vh 10px 0rem;
    display: flex;
    justify-content: center;
    text-align: center;
    align-items: center;
  }
  @media (max-width: 600px) {
    .content{
      display: flex;
      flex-direction: column;
    }
    .content :nth-child(1) { order: 1; }
    .content :nth-child(2) { order: 2; }
    .content :nth-child(3) { order: 3; }
    .description {
      width: 70vw;
    }
    .buttons {
      width: 40vw;
    }
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
          showToast("商店鏈接已複製到剪貼簿，請自行到相應的 app 裏貼上。", "success")
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
  let shopAdminUrl = toRouteUrl(shopAdmin.routes, '/shop/:shop_slug/admin', {
    params: { shop_slug },
  })

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
      <ion-content id="OnBoardComplete">
        <div class="content">
          <div class="box text">
            <p class="title">Your shop is now live!</p>
            <p class="description">
              Get more visitors by sharing your BookSmart shop everywhere
            </p>
          </div>
          <div class="box shop-admin">
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
          <div class="button-container box">
            <button
              class="continue-edit-button buttons"
              onclick="emit(this.dataset.submitUrl)"
              data-submit-url={shopAdminUrl}
            >
              continue editing
            </button>
            <button
              class="share-button buttons"
              onclick="shareUrl(this)"
              data-submit-url={url}
            >
              share your shop
            </button>
          </div>
        </div>
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
