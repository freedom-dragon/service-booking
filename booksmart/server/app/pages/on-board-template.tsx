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
import { proxy, User } from '../../../db/proxy.js'
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
import { getContextShop } from '../auth/shop.js'
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

// // init Swiper:
// const swiper = new Swiper('.swiper', {
//   // configure Swiper to use modules
//   modules: [Navigation, Pagination],
// })

let host = new URL(env.ORIGIN).host

let createShopTitle = ''
let iconText = 'arrow-forward-circle-outline'

let style = Style(/* css */ `
  #container {
    width: 80%;
    height: 30%;
    margin: auto;
    border: solid black 2px;
    overflow-x: scroll;
    overflow-y: hidden;
    white-space: nowrap;
    scroll-snap-type: x mandatory;
    scroll-snap-align: center;
    cursor: grab;
  }
  .template {
    background-color: lightblue;
    display: inline-block;
    margin: 0.5rem;
    height: 16.5rem;
    width: 12rem;
    scroll-snap-align: center;
  }
`)

// let onBoardTemplateScripts = (
//   <>
//     <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
//     {Script(
//       /* javascript */
//       `
//         import 'swiper/css';

//         export default () => {
//           return (
//             <Swiper
//               spaceBetween={50}
//               slidesPerView={3}
//               onSlideChange={() => console.log('slide change')}
//               onSwiper={(swiper) => console.log(swiper)}
//             >
//               <SwiperSlide>Slide 1</SwiperSlide>
//               <SwiperSlide>Slide 2</SwiperSlide>
//               <SwiperSlide>Slide 3</SwiperSlide>
//               <SwiperSlide>Slide 4</SwiperSlide>
//               <SwiperSlide>Slide 4</SwiperSlide>
//               <SwiperSlide>Slide 4</SwiperSlide>
//               <SwiperSlide>Slide 4</SwiperSlide>
//             </Swiper>
//           );
//         };
//         `,
//     )}
//   </>
// )
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
  console.log('template: ', templates)
  console.log('template: ' + templates)
  if (!templates)
    return 'error retrieving template images, please try again later.'
  return (
    <>
      <swiper-container
        class="mySwiper"
        // pagination="true"
        // pagination-clickable="true"
        space-between="30"
        slides-per-view="3"
      >
        {mapArray(templates, item => (
          <swiper-slide>
            <img src={item} />
          </swiper-slide>
        ))}
      </swiper-container>
    </>
  )
}

function CreateAccount(attrs: {}, context: DynamicContext) {
  let user = getAuthUser(context)
  if (!user) {
    return (
      <>
        <p>正在以訪客身份瀏覽此頁。</p>
        <p>
          你可以
          <Link href={toRouteUrl(onBoard.routes, '/on-board')}>登入</Link>
          以管理店舖資料。
        </p>
      </>
    )
  }
}

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
      <ion-content class="ion-padding">
        <div id="OnBoardTemplate">
          <p hidden>{commonTemplatePageText}</p>
          <p>
            Welcome to {config.short_site_name}!
            <br />
            Let's begin the adventure~
          </p>
          <OnBoardTemplate />
        </div>
      </ion-content>
    </>
  )
}

function OnBoardTemplate(_attrs: {}, context: DynamicContext) {
  let user_id = getAuthUserId(context)
  // let templates = getTemplateImages().template
  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css"
      />
      <div>Continue with:</div>
      <form
        id="container"
        method="POST"
        action={toRouteUrl(
          verificationCode.routes,
          '/merchant/verify/email/submit',
        )}
        onsubmit="emitForm(event)"
      >
        {<GenerateImage />}
        {/* <swiper-slide>Slide 1</swiper-slide>
          <swiper-slide>Slide 2</swiper-slide>
          <swiper-slide>Slide 3</swiper-slide>
          <swiper-slide>Slide 4</swiper-slide>
          <swiper-slide>Slide 5</swiper-slide>
          <swiper-slide>Slide 6</swiper-slide>
          <swiper-slide>Slide 7</swiper-slide>
          <swiper-slide>Slide 8</swiper-slide>
          <swiper-slide>Slide 9</swiper-slide> */}
        {/* </swiper-container> */}
        <div></div>
        <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-element-bundle.min.js"></script>
      </form>
      {/* {onBoardTemplateScripts} */}
      {wsStatus.safeArea}
    </>
  )
}

let routes: Routes = {
  '/on-board/template': {
    title: title('選擇商店界面樣式'),
    description: `Register to access exclusive content and functionality. Join our community on ${config.short_site_name}.`,
    guestOnly: true,
    node: OnBoardTemplatePage,
  },
}
export default { routes }
