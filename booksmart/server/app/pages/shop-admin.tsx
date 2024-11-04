import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { title } from '../../config.js'
import Style from '../components/style.js'
import { mapArray } from '../components/fragment.js'
import { ParseResult, literal, object, optional, string, values } from 'cast.ts'
import { Redirect } from '../components/router.js'
import {
  shopFieldsParser,
  getShopContacts,
  paymentMethodGroups,
  ShopPaymentMethod,
  contactFields,
  getShopLocale,
  ShopLocales,
  shopLocaleKeyParser,
  invalidateShopLocale,
  getShopCoverImage,
  getShopLogoImage,
} from '../shop-store.js'
import { find } from 'better-sqlite3-proxy'
import { Shop, proxy } from '../../../db/proxy.js'
import { ShopContacts, ShopContactsStyle } from '../components/shop-contact.js'
import { Script } from '../components/script.js'
import { HttpError, MessageException } from '../../exception.js'
import { loadClientPlugin } from '../../client-plugin.js'
import { nodeToVNode } from '../jsx/vnode.js'
import { ServerMessage } from '../../../client/types.js'
import { getContextShop } from '../auth/shop.js'
import { AppMoreBackButton } from './app-more.js'
import { DynamicContext, resolveExpressContext } from '../context.js'
import { placeholderForAttachRoutes } from '../components/placeholder.js'
import { Router } from 'express'
import { getAuthUserId } from '../auth/user.js'
import { createUploadForm } from '../upload.js'
import { join } from 'path'
import { client_config } from '../../../client/client-config.js'
import { renameSync } from 'fs'
import { updateUrlVersion } from '../url-version.js'
import { getAuthRole } from '../auth/role.js'
import shopHome from './shop-home.js'
import { toRouteUrl } from '../../url.js'
import onBoardTemplate from './on-board-template.js'

let pageTitle = '商戶管理'

let style = Style(/* css */ `
.scroll-nav {
  display: flex;
  justify-content: space-around;
  background-color: var(--ion-color-light);
  padding: 0.5rem 0;
}
#ShopAdmin {

}
/* setting hidden on button doesn't work, the attribute is removed by runtime */
.image-field--image {
  margin: 0.5rem;
}
.image-field ion-button[disabled] {
  display: none;
}
`)

let ShopAdminScripts = (
  <>
    {loadClientPlugin({ entryFile: 'dist/client/sweetalert.js' }).node}
    {loadClientPlugin({ entryFile: 'dist/client/image.js' }).node}
    {Script(/* javascript */ `
async function editImage(editButton, selectFn) {
  let saveButton = editButton.parentElement.querySelector('[data-save-url]')
  let item = editButton.closest('.image-field')
  let image = item.querySelector('.image-field--image')
  let photo = await selectFn()
  if (!photo) return
  image.src = photo.dataUrl
  saveButton.file = photo.file
  saveButton.disabled = false
}
async function saveImage(saveButton) {
  let url = saveButton.dataset.saveUrl
  let item = saveButton.closest('.image-field')
  let label = item.querySelector('ion-label').textContent
  let formData = new FormData()
  formData.append('file', saveButton.file)
  let res = await upload(url, formData)
  let json = await res.json()
  if (json.error) {
    showToast(json.error, 'error')
    return
  }
  if (json.message) {
    onServerMessage(json.message)
    return
  }
  showToast('更新了' + label, 'info')
  saveButton.disabled = true
}
function clearField(button) {
  let url = button.dataset.saveUrl
  let item = button.closest('ion-item')
  let input = item.querySelector('ion-input')
  input.value = ''
  emit(url, '', input.label)
}
function saveField(button) {
  let url = button.dataset.saveUrl
  let item = button.closest('ion-item')
  let input = item.querySelector('ion-input')
           || item.querySelector('ion-textarea')
  emit(url, input.value, input.label)
}
document.querySelectorAll('ion-checkbox[name="floating_contact_method"]').forEach(checkbox => {
  checkbox.addEventListener('ionChange', event => {
    let field = event.detail.value
    let checked = event.detail.checked
    let { label, url } = event.target.dataset
    let value = checked ? field : ''
    if (checked) {
      document.querySelectorAll('ion-checkbox[name="floating_contact_method"]').forEach(other => {
        if (other != checkbox) {
          other.checked = false
        }
      })
    }
    emit(url, value, label)
  })
})
`)}
  </>
)

type LocaleItem = {
  label: string
  key: keyof ShopLocales
}

let defaultLocale = getShopLocale(0)

function ShopAdmin(attrs: { shop: Shop }, context: DynamicContext) {
  let { shop } = attrs
  let shop_slug = shop.slug
  let { accept_cash } = shop
  let urlPrefix = `/shop/${shop_slug}/admin`
  let contacts = getShopContacts(shop)
    .map(item => ({
      ...item,
      value: shop[item.field],
    }))
    .sort((a, b) => {
      if (a.value && !b.value) return -1
      if (!a.value && b.value) return +1
      return 0
    })
  let localeItems: LocaleItem[] = [
    { label: '服務', key: 'service' },
    // { label: '服務提供者', key: 'tutor' },
  ]
  return (
    <>
      {style}
      {ShopContactsStyle}
      <ion-header>
        <ion-toolbar>
          <AppMoreBackButton />
          <ion-title role="heading" aria-level="1">
            {pageTitle}
          </ion-title>
        </ion-toolbar>
        <nav class="scroll-nav">
          <a href="#shop-settings" onclick="scrollToSection(event)">
            店面設定
          </a>
          <a href="#payment-methods" onclick="scrollToSection(event)">
            付款方法
          </a>
          <a href="#contact-methods" onclick="scrollToSection(event)">
            聯絡方法
          </a>
          <a href="#locale-settings" onclick="scrollToSection(event)">
            用字設定
          </a>
        </nav>
      </ion-header>
      <ion-content id="ShopAdmin" class="ion-padding" color="light">
        {Script(/* javascript */ `
          function scrollToSection(event) {
            event.preventDefault();
            let target = document.querySelector(event.currentTarget.getAttribute('href'));
            target.scrollIntoView({
              behavior: 'smooth'
            })
          }
        `)}
        <ion-list-header aria-level="3" id="shop-settings">
          店面設定
        </ion-list-header>
        <ion-note color="dark">
          <div class="ion-margin-horizontal">編輯店舖主頁的內容。</div>
        </ion-note>
        <ion-list inset="true">
          <ion-item>
            <ion-input
              label="店舖名稱"
              label-placement="stacked"
              auto-grow
              value={shop.name}
            />
            <ion-buttons slot="end">
              <ion-button
                color="success"
                data-save-url={`${urlPrefix}/save/name`}
                onclick="saveField(this)"
              >
                <ion-icon name="save" slot="icon-only"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-item>
          <ion-item class="image-field">
            <ion-label position="stacked">店舖標誌</ion-label>
            <img
              class="image-field--image shop-logo"
              src={getShopLogoImage(shop_slug)}
            />
            <ion-buttons slot="end">
              <ion-button onclick="editImage(this, selectShopLogo)">
                <ion-icon name="create" slot="icon-only" />
              </ion-button>
              <ion-button
                disabled
                color="success"
                data-save-url={`${urlPrefix}/image?name=logo`}
                onclick="saveImage(this)"
              >
                <ion-icon name="save" slot="icon-only"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-item>
          <ion-item class="image-field">
            <ion-label position="stacked">封面相</ion-label>
            <img
              class="image-field--image shop-cover-image"
              src={getShopCoverImage(shop_slug)}
            />
            <ion-buttons slot="end">
              <ion-button onclick="editImage(this, selectShopCoverImage)">
                <ion-icon name="create" slot="icon-only" />
              </ion-button>
              <ion-button
                disabled
                color="success"
                data-save-url={`${urlPrefix}/image?name=cover`}
                onclick="saveImage(this)"
              >
                <ion-icon name="save" slot="icon-only"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-item>
          <ion-item>
            <ion-textarea
              label="關於我們 (標語)"
              label-placement="stacked"
              auto-grow
              value={shop.bio}
            />
            <ion-buttons slot="end">
              <ion-button
                color="success"
                data-save-url={`${urlPrefix}/save/bio`}
                onclick="saveField(this)"
              >
                <ion-icon name="save" slot="icon-only"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-item>
          <ion-item>
            <ion-textarea
              label="關於我們 (詳情版)"
              label-placement="stacked"
              auto-grow
              value={shop.desc}
            />
            <ion-buttons slot="end">
              <ion-button
                color="success"
                data-save-url={`${urlPrefix}/save/desc`}
                onclick="saveField(this)"
              >
                <ion-icon name="save" slot="icon-only"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-item>
        </ion-list>
        <ion-list-header aria-level="2" id="payment-methods">
          付款方法
        </ion-list-header>
        <ion-note color="dark">
          <div class="ion-margin-horizontal">
            這些付款方法會在確認預約的頁面顯示。
          </div>
          <div class="ion-margin-horizontal">請提供至少一種付款方法方法。</div>
        </ion-note>
        <ion-list inset="true">
          <ion-item
            data-field="accept_cash"
            data-value={shop.accept_cash ? 1 : 0}
            onclick={`emit('${urlPrefix}/save/accept_cash', this.dataset.value=='1'?0:1, '現金付款')`}
          >
            <ion-label>{accept_cash ? '接受現金' : '不接受現金'}</ion-label>
            <ion-checkbox slot="end" checked={shop.accept_cash} />
          </ion-item>
        </ion-list>
        {mapArray(paymentMethodGroups, group => (
          <ion-list inset="true">
            {mapArray(group.items as ShopPaymentMethod[], item => {
              let value = shop[item.field]
              let saveUrl = `${urlPrefix}/save/${item.field}`
              return (
                <ion-item>
                  <ion-input
                    label={item.label}
                    label-placement="floating"
                    type={item.type}
                    value={value}
                    placeholder={item.placeholder}
                  />
                  <ion-buttons slot="end">
                    <ion-button
                      color="success"
                      data-save-url={saveUrl}
                      onclick="saveField(this)"
                    >
                      <ion-icon name="save" slot="icon-only"></ion-icon>
                    </ion-button>
                    <ion-button
                      color="danger"
                      data-save-url={saveUrl}
                      onclick="clearField(this)"
                    >
                      <ion-icon name="close" slot="icon-only"></ion-icon>
                    </ion-button>
                  </ion-buttons>
                </ion-item>
              )
            })}
          </ion-list>
        ))}

        <ion-list-header aria-level="3" id="contact-methods">
          聯絡方法
        </ion-list-header>
        <ion-note color="dark">
          <div class="ion-margin-horizontal">
            這些聯絡方法會在商户主頁顯示。
          </div>
          <div class="ion-margin-horizontal">請提供至少一種聯絡方法。</div>
        </ion-note>
        {mapArray(contacts, item => {
          let slug = item.value
          let saveUrl = `${urlPrefix}/save/${item.field}`
          return (
            <ion-list
              inset="true"
              class="contact--item"
              data-field={item.field}
            >
              <ion-item>
                <ion-input
                  label={item.label}
                  label-placement="floating"
                  type={item.type}
                  value={slug}
                />
                <ion-buttons slot="end">
                  <ion-button
                    color="success"
                    data-save-url={saveUrl}
                    onclick="saveField(this)"
                  >
                    <ion-icon name="save" slot="icon-only"></ion-icon>
                  </ion-button>
                  <ion-button
                    color="danger"
                    data-save-url={saveUrl}
                    onclick="clearField(this)"
                  >
                    <ion-icon name="close" slot="icon-only"></ion-icon>
                  </ion-button>
                </ion-buttons>
              </ion-item>
              <ion-item>
                <ion-checkbox
                  checked={shop.floating_contact_method == item.field}
                  name="floating_contact_method"
                  value={item.field}
                  data-label={'浮動' + item.label}
                  data-shop-slug={shop_slug}
                  data-url={toRouteUrl(
                    routes,
                    '/shop/:shop_slug/admin/save/:field',
                    {
                      params: {
                        shop_slug,
                        field: 'floating_contact_method',
                      },
                    },
                  )}
                >
                  主頁右下方浮標
                </ion-checkbox>
              </ion-item>
              <div class="contact--preview">
                <ion-note color="dark" class="ion-margin-horizontal">
                  預覽
                </ion-note>
                {slug ? <ShopContacts shop={shop} items={[item]} /> : '(無)'}
              </div>
            </ion-list>
          )
        })}

        <ion-list-header aria-level="3" id="locale-settings">
          用字設定
        </ion-list-header>
        <ion-note color="dark">
          <div class="ion-margin-horizontal">
            你可以訂製網站的用字，而更好地表達你的業務性質。
          </div>
        </ion-note>
        <ion-list inset="true">
          {mapArray(localeItems, localeItem => (
            <ion-item>
              <ion-input
                label={localeItem.label}
                value={
                  find(proxy.shop_locale, {
                    shop_id: shop.id!,
                    key: localeItem.key,
                  })?.value
                }
                placeholder={defaultLocale[localeItem.key]}
              />
              <ion-buttons slot="end">
                <ion-button
                  color="success"
                  data-save-url={`${urlPrefix}/locale/${localeItem.key}`}
                  onclick="saveField(this)"
                >
                  <ion-icon name="save" slot="icon-only"></ion-icon>
                </ion-button>
                <ion-button
                  color="danger"
                  data-save-url={`${urlPrefix}/locale/${localeItem.key}`}
                  onclick="clearField(this)"
                >
                  <ion-icon name="close" slot="icon-only"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-item>
          ))}
        </ion-list>
      </ion-content>
      {ShopAdminScripts}
    </>
  )
}

function attachRoutes(app: Router) {
  app.post(
    '/shop/:shop_slug/admin/image' satisfies keyof typeof routes,
    async (req, res, next) => {
      try {
        let context = resolveExpressContext(req, res, next)

        let user_id = getAuthUserId(context)
        if (!user_id) throw 'not login'

        let user = proxy.user[user_id]
        if (!user) throw 'user not found'

        let shop = getContextShop(context)
        if (user_id != shop.owner_id) throw 'not shop owner'

        let dir = join('public', 'assets', 'shops', shop.slug)
        let filename = ''

        let name = req.query.name
        switch (name) {
          case 'logo':
            filename = 'logo.webp'
            break
          case 'cover':
            filename = 'cover.webp'
            break
          default:
            throw new MessageException([
              'eval',
              `showToast('invalid field name: ${name}', 'error')`,
            ])
        }
        let image_url = join(dir, filename).replace('public', '')

        let form = createUploadForm({
          uploadDir: dir,
          filename: filename + '.tmp',
          maxFileSize: client_config.safe_max_image_size,
        })
        let [fields, files] = await form.parse(req)

        let file = files.file?.[0].filepath
        if (!file) throw new HttpError(400, 'missing file')

        renameSync(file, file.replace(/\.tmp$/, ''))

        updateUrlVersion(image_url)

        res.json({})
      } catch (error) {
        if (error instanceof MessageException) {
          res.json({ message: error.message })
        } else {
          next(error)
        }
      }
    },
  )
}

let routes = {
  '/shop/:shop_slug/admin': {
    resolve(context) {
      let shop = getContextShop(context)
      let { is_owner } = getAuthRole(context)
      let shop_name = shop.name
      return {
        title: title(shop_name),
        description: 'Admin page for ' + shop_name,
        node: is_owner ? (
          <ShopAdmin shop={shop} />
        ) : (
          <Redirect
            href={toRouteUrl(shopHome.routes, '/shop/:shop_slug', {
              params: { shop_slug: shop.slug },
            })}
          />
        ),
      }
    },
  },
  '/shop/:shop_slug/admin/image': placeholderForAttachRoutes,
  '/shop/:shop_slug/admin/save/:field': {
    resolve(context) {
      console.log('success')
      if (context.type !== 'ws') {
        return {
          title: title('method not supported'),
          description: 'update shop info',
          node: 'this api is only for ws',
        }
      }
      let { shop_slug } = context.routerMatch?.params
      let shop = find(proxy.shop, { slug: shop_slug })
      if (!shop) {
        return {
          title: title('shop not found'),
          description: 'update shop info',
          node: <Redirect href={`/`} />,
        }
      }
      let { is_owner } = getAuthRole(context)
      if (!is_owner) {
        return {
          title: title('not shop owner'),
          description: 'update shop info',
          node: (
            <Redirect
              href={toRouteUrl(shopHome.routes, '/shop/:shop_slug', {
                params: { shop_slug },
              })}
            />
          ),
        }
      }
      let {
        0: value,
        1: label,
        2: from,
      } = object({
        0: string({ nonEmpty: false, trim: true }),
        1: string({ nonEmpty: true }),
        2: optional(values(['onboarding' as const])),
      }).parse(context.args)

      let field: ParseResult<typeof shopFieldsParser>
      try {
        field = shopFieldsParser.parse(context.routerMatch?.params.field)
      } catch (error) {
        throw new MessageException([
          'eval',
          `showToast('invalid field: ${context.routerMatch?.params.field}', 'error')`,
        ])
      }

      if (value.length == 0) {
        let messages: ServerMessage[] = []
        if (field == 'name') {
          messages.push(['eval', `showToast('店舖名稱不能留空','warning')`])
        } else {
          shop[field] = null
          messages.push(['eval', `showToast('除去了${label}','info')`])
        }
        if (contactFields.includes(field as any)) {
          messages.push([
            'update-in',
            `.contact--item[data-field="${field}"] .contact--preview`,
            nodeToVNode(
              <>
                <ion-note color="dark" class="ion-margin-horizontal">
                  預覽
                </ion-note>
                (無)
              </>,
              context,
            ),
          ])
        }
        throw new MessageException(['batch', messages])
      }

      let messages: ServerMessage[] = []

      if (field == 'accept_cash') {
        shop.accept_cash = value == '1'
        messages.push(
          [
            'eval',
            value == '1'
              ? `showToast('現接受現金','info')`
              : `showToast('現不接受現金','info')`,
          ],
          [
            'update-attrs',
            '[data-field="accept_cash"]',
            { 'data-value': value },
          ],
          [
            'update-text',
            '[data-field="accept_cash"] ion-label',
            value == '1' ? '接受現金' : '不接受現金',
          ],
          [
            'update-attrs',
            '[data-field="accept_cash"] ion-checkbox',
            { checked: value == '1' },
          ],
        )
      } else {
        if (field == 'name') {
          let name = find(proxy.shop, { name: value })
          if (!name) {
            messages.push([
              'eval',
              `showToast('商鋪名稱已被使用，請重新輸入。','warning')`,
            ])
          }
        }

        shop[field] = value
        messages.push(['eval', `showToast('更新了${label}','info')`])
        if (from == 'onboarding') {
          console.log('onboarding works')
          messages.push([
            'redirect',
            toRouteUrl(
              onBoardTemplate.routes,
              '/on-board/:shop_slug/template',
              { params: { shop_slug } },
            ),
          ])
        }
      }

      if (contactFields.includes(field as any)) {
        messages.push([
          'update-in',
          `.contact--item[data-field="${field}"] .contact--preview`,
          nodeToVNode(
            <>
              <ion-note color="dark" class="ion-margin-horizontal">
                預覽
              </ion-note>
              <ShopContacts
                shop={shop}
                items={getShopContacts(shop).filter(
                  item => item.field == field,
                )}
              />
            </>,
            context,
          ),
        ])
      }
      throw new MessageException(['batch', messages])
    },
  },
  '/shop/:shop_slug/admin/locale/:key': {
    resolve(context) {
      if (context.type !== 'ws') {
        return {
          title: title('method not supported'),
          description: 'update shop locale',
          node: 'this api is only for ws',
        }
      }
      let { shop_slug } = context.routerMatch?.params
      let shop = find(proxy.shop, { slug: shop_slug })
      if (!shop) {
        return {
          title: title('shop not found'),
          description: 'update shop locale',
          node: <Redirect href={`/`} />,
        }
      }
      let { is_owner } = getAuthRole(context)
      if (!is_owner) {
        return {
          title: title('not shop owner'),
          description: 'update shop info',
          node: (
            <Redirect
              href={toRouteUrl(shopHome.routes, '/shop/:shop_slug', {
                params: { shop_slug },
              })}
            />
          ),
        }
      }
      let { 0: value, 1: label } = object({
        0: string({ nonEmpty: false, trim: true }),
        1: string({ nonEmpty: true }),
      }).parse(context.args)

      let key = shopLocaleKeyParser.parse(context.routerMatch?.params.key)

      let row = find(proxy.shop_locale, { shop_id: shop.id!, key })
      if (row) {
        row.value = value
      } else {
        proxy.shop_locale.push({ shop_id: shop.id!, key, value })
      }
      invalidateShopLocale(shop.id!)

      throw new MessageException([
        'eval',
        value.length == 0
          ? `showToast('重置了${label}','info')`
          : `showToast('更新了${label}','info')`,
      ])
    },
  },
} satisfies Routes

export default { routes, attachRoutes }
