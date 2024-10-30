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
import { find } from 'better-sqlite3-proxy'
import { proxy, User } from '../../../db/proxy.js'
import { ServerMessage } from '../../../client/types.js'
import { is_email } from '@beenotung/tslib'
import { Raw } from '../components/raw.js'
import { hashPassword } from '../../hash.js'
import { Routes, StaticPageRoute } from '../routes.js'
import { Node } from '../jsx/types.js'
import { renderError } from '../components/error.js'
import { getContextCookies, getWsCookies } from '../cookie.js'
import { getAuthUser, getAuthUserId } from '../auth/user.js'
import { IonBackButton } from '../components/ion-back-button.js'
import { toRouteUrl } from '../../url.js'
import { getContextShop } from '../auth/shop.js'
import { loadClientPlugin } from '../../client-plugin.js'
import Home from './home.js'
import onBoardShopSlug from './on-board-shop-slug.js'
import { Script } from '../components/script.js'
import { getShopLogoImage } from '../shop-store.js'
import { object, ParseResult, string } from 'cast.ts'
import { Formidable } from 'formidable'
import { placeholderForAttachRoutes } from '../components/placeholder.js'
import { Router } from 'express'
import onBoard from './on-board.js'
import shopAdmin from './shop-admin.js'

let style = Style(/* css */ `
  #OnBoardShopProfile {
    background-color: #fafafa
  }
  #shop_name {
    background:transparent;
    margin: 0.7rem;
    width: 87%;
    text-align: center;
    box-shadow: none;
    border: none; 
  }
  #shop_name::placeholder {
    color: #000000;
  }
  #shop_name:focus {
    outline: none;
  }
  #submit_button {
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    background-color: transparent; 
    cursor: pointer;
    overflow: hidden;
  }

  div {
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
  }
  .texts {
    background-color: transparent;
    max-width: 17rem;
  }
  .profile {
    font-family: sans-serif;
    text-align: center;
    min-height: 1rem;
    font-size: 0.8rem;
    color: #9c9c9c;
    text-transform: uppercase;
  }
  .description{
    font-family: 'Arial', sans-serif;
    text-align: center;
    margin-top: 1.5rem;
    font-size: 1.1rem;
    font-weight: 400;
    line-height: 1.375;
    color: black;
  }
  .input-body{
    width: 17rem;
    background-color: var(--ion-color-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 3rem;
    margin-bottom: 0.5rem;
  }
  .circle{
    width: 10rem;
    height: 10rem;
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
  .icon{
    text-align: center;
    font-size: 2rem;
    color: var(--ion-color-primary);
    background-color: transparent;
    margin: auto;
  }
  .shop-logo{
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    max-height: 100%;
    max-width: 100%;
  }
`)
// let hasLogo = (
//   <>
//   {Script(/* javascript */ `
//     document.getElementById("image-wrapper").hidden = false
//     document.getElementById("image").hidden = true
//     `
//   )}
//   </>
// )
let onBoardShopProfileScripts = (
  <>
    {loadClientPlugin({ entryFile: 'dist/client/sweetalert.js' }).node}
    {loadClientPlugin({ entryFile: 'dist/client/image.js' }).node}
    {Script(/* javascript */ `
      // async function hasLogo(item) {
      //   console.log("item: ", item);
      //   console.log("hasLogo: ", check_logo)
      //   let url = getShopLogoImage(shop_slug)
      //   let check_logo = url.includes('?t=')

      //   if (check_logo) {
      //     item.style.display = 'none'
      //     item.parentElement.querySelector('#image-wrapper').style.display = 'block'
      //   }
      //   else {
      //     item.style.display = 'block'
      //     item.parentElement.querySelector('#image-wrapper').style.display = 'none'
      //   }
      // }
      async function editImage(editButton, selectFn) {
        let saveButton = editButton.parentElement.parentElement.querySelector('[data-upload-url]')
        console.log(saveButton)
        let item = editButton.closest('.image-field')
        let image = item.querySelector('.image-field--image')
        //let icon = item.querySelector('.icon')
        console.log("image: ", image)
        let photo = await selectFn()
        console.log("photo: ", photo)
        if (!photo) return
        console.log("dataUrl: " + photo.dataUrl)

        image.style.display = 'block'
        // icon.style.display = 'none'
        
        has_logo = true
        image.src = photo.dataUrl
        saveButton.file = photo.file
        saveButton.disabled = false
      }
      async function Next(saveButton) {
        
        let url = saveButton.dataset.uploadUrl
        console.log("saveButton: ",saveButton)
        console.log("url: ", url)
        console.log("saveButton file: ", saveButton.file)
        // let item = saveButton.closest('.circle')
        // console.log("item: " + item)
        let label = '商舖圖片'//= item.querySelector('ion-label').textContent
        let formData = new FormData()
        formData.append('file', saveButton.file)
        console.log(formData)
        let res = await upload(url, formData)
        let json = await res.json()
        
        if (json.error) {
          showToast(json.error, 'error')
        }
        // if (json.message) {
        //   onServerMessage(json.message)
        //   //return
        // }

        let input = saveButton.parentElement.querySelector('input')
        console.log("test: ", input.value)
        value = input.value
        let submit_url = saveButton.dataset.submitUrl
        res = await emit(submit_url, value, label, 'onboarding')
        console.log("res: " + res)
        json = await res.json()
        if (json.error) {
          showToast(json.error, 'error')
        }
        showToast('更新了' + label, 'info')
        if (json.message) {
            onServerMessage(json.message)
          }
        return //(<Redirect href={toRouteUrl(Home.routes, '/')} />)
      }
    `)}
  </>
)

function OnBoardShopProfilePage(attrs: {}, context: DynamicContext) {
  let user_id = getAuthUserId(context)
  let shop = getContextShop(context)

  let shop_slug = shop.slug
  let urlPrefix = `/on-board/${shop_slug}/profile`

  if (!shop) {
    return <Redirect href={toRouteUrl(Home.routes, '/')} />
  }
  if (shop.owner_id != user_id) {
    return <Redirect href={toRouteUrl(Home.routes, '/')} />
  }

  let logo_url = getShopLogoImage(shop_slug)
  let name = shop.name
  let has_logo = logo_url.includes('?t=')

  return (
    <>
      {style}
      <ion-header>
        <ion-toolbar color="primary">
          <IonBackButton
            href={toRouteUrl(onBoardShopSlug.routes, '/on-board/shop-slug')}
            color="light"
            backText="Admin"
          />
          <ion-title role="heading" aria-level="1">
            商戶設置
          </ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content id="OnBoardShopProfile" class="ion-padding">
        <div class="texts">
          <p class="profile">profile</p>
          <p class="description">
            Tell us about your shop name and logo by filling in the form
          </p>
        </div>
        <form
          class="form-inline"
          method="POST"
          // action={toRouteUrl(routes, '/on-board/:shop_slug/profile/submit', {
          //   params: {
          //     shop_slug: shop.slug,
          //   },
          // })}
          onsubmit="uploadForm(event)"
        >
          <div class="input-body image-field">
            <button
              onclick="editImage(this, selectShopLogo)"
              class="circle"
              type="button"
            >
              {/* {has_logo} ?  */}
              <img
                class="image-field--image shop-logo"
                id="image-wrapper"
                src={logo_url}
                onload="this.parentElement.querySelector('ion-icon').style.display='none'"
                onerror="this.onerror=null; this.style.display='none'; this.parentElement.querySelector('ion-icon').style.display='block'"
              />
              <ion-icon
                name="image"
                slot="icon-only"
                class="icon"
                style="display: none"
              ></ion-icon>
            </button>
          </div>
          <div class="input-body">
            <input
              id="shop_name"
              name="shop_name"
              type="text"
              placeholderForAttachRoutes="shopName"
              value={name}
            ></input>
          </div>
          <button
            id="submit_button"
            type="submit"
            onclick="Next(this)"
            data-upload-url={toRouteUrl(
              shopAdmin.routes,
              '/shop/:shop_slug/admin/image',
              {
                params: { shop_slug },
                query: { name: 'logo' },
              },
            )}
            data-submit-url={toRouteUrl(
              shopAdmin.routes,
              '/shop/:shop_slug/admin/save/:field',
              {
                params: { shop_slug, field: 'name' },
              },
            )}
          >
            {/* `/shop/${shop_slug}/admin/image?name=logo` */}
            <ion-icon
              name="chevron-forward-circle"
              class="icon"
              style="font-size: 3rem;"
            ></ion-icon>
          </button>
        </form>
        <p class="ion-text-center">
          <ion-text id="submitMessage"></ion-text>
        </p>
        {onBoardShopProfileScripts}
      </ion-content>
    </>
  )
}

let routes = {
  '/on-board/:shop_slug/profile': {
    title: '商戶設置',
    description: `Manage shops for on-board users`,
    adminOnly: false,
    node: <OnBoardShopProfilePage />,
  },
} satisfies Routes

export default { routes }
