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
    width: 33vh;
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
  .side-panel {
    height: 100vh;
    width: 400px;
    position: fixed;
    left: -400px;
    background-color: white;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2);
    transition: left 0.3s ease;
    z-index: 1000;
    padding: 20px;
    box-sizing: border-box;
    overflow-y: scroll;
}
.side-panel.open {
    left: 0;
}
.panel-toggle {
    position: absolute;
    left: 20px;
    padding: 10px 20px;
    background-color: #333;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    z-index: 1001;
}
.overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease;
    z-index: 999;
}

.overlay.active {
    opacity: 1;
    visibility: visible;
}

.edit-form {
  padding: 20px;
}

.section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 15px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: 1fr, 10px;
  gap: 10px;
  margin-bottom: 20px;
}

.color-item {
  aspect-ratio: 1;
  background-color: #fff;
  border-radius: 5rem;
  border: 1px solid #ddd;
  overflow: hidden;
}

.color-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.color-text {
  text-align: center;
}
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
}

.form-group input, 
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: white;
  box-sizing: border-box;
}

.design-options {
  display: flex;
  gap: 10px;
}

.design-option {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 3rem;
  cursor: pointer;
  background-color: white;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.design-option:hover {
  background-color: #bbb;
}
.design-option.active {
  background-color: #333;
  color: white;
  border-color: #333;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 15px;
}

.template-item {
  aspect-ratio: 1/1;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
}

.template-item:hover {
  border-color: #333;
}
.panel-content {
    color: #333;
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
    function ToggleMenu(element) {
      let button = element
      let sidePanel = element.parentElement.querySelector(".side-panel")
      let overlay = element.parentElement.querySelector(".overlay")
      sidePanel.classList.toggle("open")
      overlay.classList.toggle("active")
    }
    function CloseMenu(element) {
      let overlay = element
      let sidePanel = element.parentElement.querySelector(".side-panel")
      sidePanel.classList.remove("open")
      overlay.classList.remove("active")
    }
    function ToggleButton(element) {
      let buttons = element.parentElement.querySelectorAll("button")
      buttons.forEach((button) => {
        button.classList.remove("active")
      })
      element.classList.add("active")
    }
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
        <button class="panel-toggle" onclick="ToggleMenu(this)">
          ☰ Menu
        </button>
        <div class="overlay" onclick="CloseMenu(this)"></div>
        <div class="side-panel">
          <div class="panel-content">
            <h2>Side Panel</h2>
            <div class="edit-form">
              <div class="section">
                <div class="section-title">背景顔色</div>
                <div class="image-grid">
                  <div class="color-item" style="background-color: ;"></div>
                  <div
                    class="color-item"
                    style="background-color: #F7D4D2"
                  ></div>
                  <div
                    class="color-item"
                    style="background-color: #BDABAB;"
                  ></div>
                  <div
                    class="color-item"
                    style="background-color: #C2DFFF;"
                  ></div>
                  <div class="color-text">Default</div>
                  <div class="color-text">Candy</div>
                  <div class="color-text">Ocean</div>
                  <div class="color-text">Land</div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">ABOUT</div>
                <div class="form-group">
                  <label>NAME</label>
                  <input type="text" placeholder="Enter name" />
                </div>
                <div class="form-group">
                  <label>DESCRIPTION</label>
                  <textarea rows="4" placeholder="Add Description"></textarea>
                </div>
              </div>

              <div class="section">
                <div class="section-title">SITE</div>
                <div class="form-group">
                  <label>URL</label>
                  <input type="text" placeholder="Enter URL" />
                </div>
              </div>

              <div class="section">
                <div class="section-title">文字設計</div>
                <div class="design-options">
                  <button
                    class="design-option active"
                    onclick="ToggleButton(this)"
                  >
                    Noto Serif
                  </button>
                  <button class="design-option" onclick="ToggleButton(this)">
                    WenKai TC
                  </button>
                  <button class="design-option" onclick="ToggleButton(this)">
                    Classical Sans
                  </button>
                </div>
                <div class="template-grid">
                  <div class="template-item"></div>
                  <div class="template-item"></div>
                  <div class="template-item"></div>
                  <div class="template-item"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
