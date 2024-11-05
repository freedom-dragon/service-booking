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
  WsContext,
} from '../context.js'
import { EarlyTerminate } from '../../exception.js'
import { o } from '../jsx/jsx.js'
import { find } from 'better-sqlite3-proxy'
import { Shop, proxy, User } from '../../../db/proxy.js'
import { ServerMessage } from '../../../client/types.js'
import { is_email } from '@beenotung/tslib'
import { Raw } from '../components/raw.js'
import { hashPassword } from '../../hash.js'
import { Routes, StaticPageRoute } from '../routes.js'
import { Node } from '../jsx/types.js'
import { renderError } from '../components/error.js'
import { getWsCookies } from '../cookie.js'
import { getAuthUser, getAuthUserId } from '../auth/user.js'
import { UserMessageInGuestView } from './profile.js'
import { IonBackButton } from '../components/ion-back-button.js'
import { wsStatus } from '../components/ws-status.js'
import { LoginLink, loginRouteUrl } from './login.js'
import { toRouteUrl } from '../../url.js'
import verificationCode from './verification-code.js'
import { getContextShop, getContextShopSlug } from '../auth/shop.js'
import { loadClientPlugin } from '../../client-plugin.js'
import onBoardAccount from './on-board-account.js'
import { env } from '../../env.js'
import onBoard from './on-board.js'
import home from './home.js'
import onBoardEmail from './on-board-email.js'
//import { Swiper } from '../components/swiper.js'
import { readdirSync } from 'fs'
import { toVersionedUrl } from '../url-version.js'
import { Script } from '../components/script.js'
import { mapArray } from '../components/fragment.js'
import { number, object, string, values } from 'cast.ts'
import { Swiper } from '../components/swiper.js'
import { getAuthRole } from '../auth/role.js'
import onBoardShopProfile from './on-board-shop-profile.js'
let host = new URL(env.ORIGIN).host
let createShopTitle = ''
let iconText = 'arrow-forward-circle-outline'
let style = Style(/* css */ `
  
  #OnBoardTemplate {
    height: 80vh;
  }
  #container {
    width: 100vw;
    height: 30vh;
    margin: auto;
    overflow: visible;
    white-space: nowrap;
    scroll-snap-type: x mandatory;
    scroll-snap-align: center;
    cursor: grab;
  }

  .inner-scroll{
    padding-inline-start: 0px !important;  
    padding-inline-end: 0px !important;
  }
  .title {
    font-size: 2rem;
    color: var(--ion-color-primary);
    margin: auto;
    display: flex;
    justify-content: center;
    margin-bottom: 3.5rem;
    padding: none;
    text-align: center;

  }

  .template {
    background-color: lightblue;
    display: inline-block;
    margin: 0.5rem;
    height: 16.5rem;
    width: 12rem;
    scroll-snap-align: center;
  }

  .buttons {
    width: 15rem;
    height: 3rem;
    padding: none;
    border-radius: 0.5rem;
    background-color: var(--ion-color-primary);
    color: white;
    cursor: pointer;
    margin: 3.5rem auto 0rem;
    font-size: 1.2rem;
    display: flex;
    justify-content: center;
    text-align: center;
    align-items: center;
  }
  img {
    border-radius: 1rem;
    max-height: 300px;
    min-height: 250px;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
  }

  swiper-slide {
    display: flex;
    justify-content: center;
    width: auto;
    overflow-y: visible;
  }
  
  .swiper-slide-active {
    transform: scale(1.2);
    transition: transform 0.3s ease;
  }


.mySwiper .swiper {
  overflow: visible;
}


`)

let submitParser = object({
  template: object({ 0: number() }),
  length: object({ 0: number() }),
})

let onBoardTemplateScripts = (
  <>
    {loadClientPlugin({ entryFile: 'dist/client/sweetalert.js' }).node}
    {loadClientPlugin({ entryFile: 'dist/client/image.js' }).node}
    {Script(/* javascript */ `
      async function getProgress(element) {
        try{
          let swiperEl = element.parentElement.querySelector('swiper-container')
            if (swiperEl) {
              let index = swiperEl.swiper.realIndex + 1
              let length = swiperEl.swiper.slides.length
              let url = element.dataset.submitUrl
              // console.log("url: " + url)
              // console.log("index: " + index)
              // console.log("length: " + length)
              res = await emit(url, index, length)
              // json = await res.json()
              // if (json.error) {
              //   showToast(json.error, 'error')
              //   return
              // }
              // if (json.message) {
              //   onServerMessage(json.message)
              // }
            }
        } catch (e) {
          showToast(e, 'error')
        }
        
      }
      
        
    `)}
  </>
)
export function getTemplateImageLinks() {
  let dir = `assets/templates`
  let filenames: string[]
  try {
    filenames = readdirSync(`public/${dir}`)
  } catch (error) {
    // file not found
    filenames = []
  }
  let template: string[] = []
  for (let filename of filenames) {
    template.push(toVersionedUrl(`/${dir}/${filename}`))
  }
  return { template }
}
function GenerateImage(attrs: {}, context: DynamicContext) {
  let templates = getTemplateImageLinks().template
  if (!templates)
    return 'error retrieving template images, please try again later.'
  // if (!'dev') {
  //   return (
  //     <Swiper
  //       id="testSlider"
  //       showPagination
  //       slideWidth="30%"
  //       showArrow
  //       slides={[<div style="background:red">1</div>, <>2</>, <>3</>]}
  //     ></Swiper>
  //   )
  // }
  return (
    <>
      <swiper-container
        id="templateSlider"
        class="mySwiper"
        onload="fixSwiperBorder()"
        // pagination="true"
        // pagination-clickable="true"
        space-between="50"
        slides-per-view="auto"
        centered-slides="true"
        zoom="true"
      >
        {mapArray(templates, item => (
          <swiper-slide>
            <img src={item} />
          </swiper-slide>
        ))}
      </swiper-container>
      {Script(/* javascript */ `
function fixTemplateSlider() {
  // console.log('fixTemplateSlider')
  let node = templateSlider.shadowRoot?.querySelector('.swiper')
  if (node) {
    node.style.overflow = 'visible'
  } else {
    setTimeout(fixTemplateSlider,33)
  }
}
setTimeout(fixTemplateSlider)
`)}
    </>
  )
}
// function CreateAccount(attrs: {}, context: DynamicContext) {
//   let user = getAuthUser(context)

//   if (!user) {
//     return (
//       <>
//         <p>正在以訪客身份瀏覽此頁。</p>
//         <p>
//           你可以
//           <Link href={toRouteUrl(onBoard.routes, '/on-board')}>登入</Link>
//           以管理店舖資料。
//         </p>
//       </>
//     )
//   }
// }
let OnBoardTemplatePage = (
  <div id="OnBoardEmail">
    {style}
    <h1>Continue with Template on {config.short_site_name}</h1>
    <p hidden>{commonTemplatePageText}</p>
    <p>
      Welcome to {config.short_site_name}!
      <br />
      Let's begin the adventure~
    </p>
    <onBoardTemplate />
  </div>
)
if (config.layout_type === LayoutType.ionic) {
  OnBoardTemplatePage = (
    <>
      {style}
      <ion-header>
        <ion-toolbar color="primary">
          <IonBackButton href="/" backText="Home" color="light" />
          <ion-title>選擇商店界面樣式</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <div id="OnBoardTemplate">
          <p hidden>{commonTemplatePageText}</p>
          <h1>
            <p class="title">Select Your Shop Template</p>
          </h1>
          <br />
          <OnBoardTemplate />
        </div>
      </ion-content>
    </>
  )
}
function OnBoardTemplate(attrs: {}, context: DynamicContext) {
  // console.log('Context: ' + context)
  let user_id = getAuthUserId(context)
  let user = getAuthUser(context)
  console.log(user?.nickname)
  if (!user_id) return <Redirect href={toRouteUrl(home.routes, '/')} />
  let shop_slug = getContextShopSlug(context)
  // console.log('shop slug: ' + shop_slug)
  let shop = getContextShop(context)
  console.log('shop: ', shop)
  // let shop_slug = shop.slug
  // let templates = getTemplateImages().template
  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css"
      />
      <form
        id="container"
        method="POST"
        // action={toRouteUrl(routes, '/on-board/:shop_slug/template/submit')}
        onsubmit="uploadForm(event)"
      >
        <GenerateImage />
        <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-element-bundle.min.js"></script>
        <button
          id="submit_button"
          type="submit"
          class="buttons"
          onload="fixSwiperBorder(this)"
          onclick="getProgress(this)"
          data-submit-url={toRouteUrl(
            routes,
            '/on-board/:shop_slug/template/submit',
            { params: { shop_slug } },
          )}
        >
          USE THIS TEMPLATE
        </button>
      </form>

      {/* {onBoardTemplateScripts} */}
      {onBoardTemplateScripts}
      {wsStatus.safeArea}
    </>
  )
}
function SubmitTemplate(
  attrs: {
    shop?: Shop
    is_owner: boolean | null
    index: number
    length: number
  },
  context: DynamicContext,
) {
  console.log('testSubmit')
  console.log('attrs.index: ' + attrs.index)
  console.log('attrs.length: ' + attrs.length)
  if (!attrs.shop) {
    console.log('Your login info is invalid, please try again later.')
    return <Redirect href={toRouteUrl(home.routes, '/')} />
  }
  if (!attrs.is_owner) {
    console.log(
      'Your are not the owner of this shop, please try to login with the correct account.',
    )
    return <Redirect href={toRouteUrl(home.routes, '/')} />
  }
  if (attrs.index === 1) {
    attrs.shop['background_color'] = '#F7D4D2'
    attrs.shop['font_family'] = 'Noto Serif'
    attrs.shop['top_banner'] = 1
    attrs.shop['booking_banner'] = 1
  } else if (attrs.index === 2) {
    attrs.shop['background_color'] = '#BDABAB'
    attrs.shop['font_family'] = 'Noto Serif'
    attrs.shop['top_banner'] = 2
    attrs.shop['booking_banner'] = 2
  } else if (attrs.index === 3) {
    attrs.shop['background_color'] = '#C2DFFF'
    attrs.shop['font_family'] = 'Noto Serif'
    attrs.shop['top_banner'] = 3
    attrs.shop['booking_banner'] = 3
  }
  return (
    <Redirect
      href={toRouteUrl(
        onBoardShopProfile.routes,
        '/on-board/:shop_slug/profile',
        { params: { shop_slug: attrs.shop.slug } },
      )}
    />
  )
}
let routes: Routes = {
  '/on-board/:shop_slug/template': {
    title: title('選擇商店界面樣式'),
    description: `For the user to choose a template for their shop`,
    guestOnly: true,
    node: OnBoardTemplatePage,
  },
  '/on-board/:shop_slug/template/submit': {
    resolve(context) {
      if (context.type !== 'ws') {
        return {
          title: title('method not supported'),
          description: 'update shop info',
          node: 'this api is only for ws',
        }
      }
      let shop = getContextShop(context)
      let { is_owner } = getAuthRole(context)
      console.log('shop: ' + shop['owner_id'])
      console.log('is_owner: ' + is_owner)
      let { 0: index, 1: length } = object({
        0: number(),
        1: number(),
      }).parse(context.args)
      console.log('index: ', index)
      console.log('length: ', length)
      return {
        title: apiEndpointTitle,
        description: `API endpoint for ${config.short_site_name}`,
        guestOnly: true,

        node: (
          <SubmitTemplate
            shop={shop}
            is_owner={is_owner}
            index={index}
            length={length}
          />
        ),
      }
    },
  },
}
export default { routes }
