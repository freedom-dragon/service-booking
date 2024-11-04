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
import onBoardComplete from './on-board-complete.js'

let style = Style(/* css */ `
  #OnBoardShopSocials {
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
    margin-top: 2rem;
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
  .socials {
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
  .social-media-inputs
  .img-icon {
    max-width: 2.25rem;
    max-height: 2.25rem;
    margin: 0.5rem 1rem 0.5rem 0.5rem;
    display: flex !important;
  }
  .social-media-inputs
  .img-icon--text {
    word-break: break-word;
    text-align: start;
  }
  .social-media-inputs {
    flex-direction: column;
    justify-content: space-around;
    align-items: start;
    width: 18.75rem;
    gap: 0.75rem;
    margin: auto;
  }
  .social-media-inputs ion-input.md {
    width: 100% !important;
    --border-radius: unset !important;
    background: var(--ion-color-secondary);
    border-radius: 0.4rem;
    justify-content: start;
    display: flex;
  }

  ion-input {
    margin: 0.5rem 0;
  }
`)
let onBoardShopSocialsScripts = (
  <>
    {loadClientPlugin({ entryFile: 'dist/client/sweetalert.js' }).node}
    {loadClientPlugin({ entryFile: 'dist/client/image.js' }).node}
    {Script(/* javascript */ `
      function socialsSubmit(saveButton, contacts) {
        console.log('hello world')
        console.log(contacts)
        
        

      }
      function saveField(button) {
        let url = button.dataset.saveUrl
        let item = button.closest('ion-item')
        let input = item.querySelector('ion-input')
                || item.querySelector('ion-textarea')
        emit(url, input.value, input.label)
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

export function OnBoardShopContacts(attrs: {
  shop: Shop
  items: ShopContact[]
}) {
  let shop_slug = attrs.shop.slug
  let { shop } = attrs
  return (
    <form
      class="social-media-inputs ion-margin"
      method="POST"
      onsubmit="uploadForm(event)"
    >
      {mapArray(attrs.items, item => {
        let slug = shop[item.field]
        return slug ? (
          <ion-input
            class="img-icon--text"
            id={item.label}
            value={slug}
            href={item.prefix + slug}
            target="_blank"
            data-save-url={`/shop/${shop_slug}/admin/save/${item.field}`}
          >
            <img
              class="img-icon"
              slot="icon-only"
              src={'/assets/contact-methods/' + item.icon}
              alt={'credit to ' + item.credit}
              aria-hidden="true"
            />
          </ion-input>
        ) : (
          <ion-input
            class="img-icon--text"
            name={item.label}
            placeholder="Add handle here"
            href={item.prefix}
            target="_blank"
          >
            <img
              class="img-icon"
              slot="icon-only"
              src={'/assets/contact-methods/' + item.icon}
              alt={'credit to ' + item.credit}
              aria-hidden="true"
            />
            <span class="img-icon--text" title={item.label}>
              {slug}
            </span>
          </ion-input>
        )
      })}
      <button
        class="submit-button"
        id="submit_button"
        type="submit"
        onclick="socialsSubmit(this)"
        data-submit-url={toRouteUrl(
          shopAdmin.routes,
          '/shop/:shop_slug/admin/save/:field',
          {
            params: { shop_slug, field: 'name' },
          },
        )}
      >
        <ion-icon
          name="chevron-forward-circle"
          class="icon"
          style="font-size: 3rem;"
        ></ion-icon>
      </button>
    </form>
  )
}

function OnBoardShopSocialsPage(attrs: {}, context: DynamicContext) {
  let user_id = getAuthUserId(context)
  let shop = getContextShop(context)
  let contacts = getShopContacts(shop)

  let shop_slug = shop.slug

  if (!shop) {
    return <Redirect href={toRouteUrl(Home.routes, '/')} />
  }
  if (shop.owner_id != user_id) {
    return <Redirect href={toRouteUrl(Home.routes, '/')} />
  }

  let logo_url = getShopLogoImage(shop_slug)
  let name = shop.name

  let floating_contact = contacts.find(
    contact => contact.field == shop.floating_contact_method,
  )
  console.log('')
  console.log('contact: ' + { contacts })
  console.log('shop: ' + shop)
  console.log('floating contact: ' + floating_contact)
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
      <ion-content id="OnBoardShopSocials" class="ion-padding">
        <div class="texts">
          <p class="socials">socials</p>
          <p class="description">
            Tell us about your links to your social media platforms (optional)
          </p>
        </div>
        <h2 class="ion-margin">聯絡方法</h2>
        <ion-note color="dark">
          <div class="ion-margin-horizontal">
            這些聯絡方法會在商户主頁顯示。
          </div>
          <div class="ion-margin-horizontal">請提供至少一種聯絡方法。</div>
        </ion-note>
        {style}
        <form
          class="social-media-inputs ion-margin"
          method="POST"
          action={toRouteUrl(routes, '/on-board/:shop_slug/socials/submit', {
            params: { shop_slug },
          })}
          //onsubmit="uploadForm(event)"
        >
          {mapArray(contacts, item => {
            let slug = shop[item.field]
            return slug ? (
              <ion-input
                class="img-icon--text"
                name={item.field}
                value={slug}
                href={item.prefix + slug}
                target="_blank"
                data-save-url={`/shop/${shop_slug}/admin/save/${item.field}`}
              >
                <img
                  class="img-icon"
                  slot="icon-only"
                  src={'/assets/contact-methods/' + item.icon}
                  alt={'credit to ' + item.credit}
                  aria-hidden="true"
                />
              </ion-input>
            ) : (
              <ion-input
                class="img-icon--text"
                name={item.field}
                placeholder="Add handle here"
                href={item.prefix}
                target="_blank"
              >
                <img
                  class="img-icon"
                  slot="icon-only"
                  src={'/assets/contact-methods/' + item.icon}
                  alt={'credit to ' + item.credit}
                  aria-hidden="true"
                />
                <span class="img-icon--text" title={item.label}>
                  {slug}
                </span>
              </ion-input>
            )
          })}
          <button class="submit-button" id="submit_button" type="submit">
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
        {onBoardShopSocialsScripts}
        {/* <OnBoardShopContacts shop={shop} items={contacts} /> */}
      </ion-content>
    </>
  )
}
let SubmitSocialsParser = object({
  address: string(),
  tel: string(),
  email: string(),
  facebook: string(),
  messenger: string(),
  instagram: string(),
  youtube: string(),
  whatsapp: string(),
  telegram: string(),
  twitter: string(),
})
function SubmitSocials(attrs: {}, context: DynamicContext) {
  try {
    let body = getContextFormBody(context)
    let input: ParseResult<typeof SubmitSocialsParser>
    let shop = getContextShop(context)
    let contacts = getShopContacts(shop)
    let shop_slug = shop.slug
    input = SubmitSocialsParser.parse(body, { name: 'req.body' })
    console.log(input)
    for (let item of contacts) {
      let field = item.field
      let value = input[field] || null
      if (shop[field] != value) {
        shop[field] = value
      }
    }
    console.log('shop_slug: ', shop_slug)
    return (
      <Redirect
        href={toRouteUrl(
          onBoardComplete.routes,
          '/on-board/:shop_slug/complete',
          {
            params: { shop_slug },
          },
        )}
      />
    )
  } catch (error) {
    let message = String(error)
    throw new MessageException(['update-text', '#submitMessage', message])
  }
}
let routes = {
  '/on-board/:shop_slug/socials': {
    title: '商戶設置',
    description: `Manage shops for on-board users`,
    adminOnly: false,
    node: <OnBoardShopSocialsPage />,
  },
  '/on-board/:shop_slug/socials/submit': {
    title: apiEndpointTitle,
    description: 'submit shop and merchant profile',
    adminOnly: false,
    node: <SubmitSocials />,
  },
} satisfies Routes

export default { routes }
