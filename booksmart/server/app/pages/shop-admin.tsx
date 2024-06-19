import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { title } from '../../config.js'
import Style from '../components/style.js'
import { mapArray } from '../components/fragment.js'
import { IonBackButton } from '../components/ion-back-button.js'
import { object, string } from 'cast.ts'
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
} from '../shop-store.js'
import { find } from 'better-sqlite3-proxy'
import { Shop, proxy } from '../../../db/proxy.js'
import { ShopContacts, ShopContactsStyle } from '../components/shop-contact.js'
import { Script } from '../components/script.js'
import { MessageException } from '../../exception.js'
import { loadClientPlugin } from '../../client-plugin.js'
import { nodeToVNode } from '../jsx/vnode.js'
import { ServerMessage } from '../../../client/types.js'

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
`)

let ShopAdminScripts = (
  <>
    {loadClientPlugin({ entryFile: 'dist/client/sweetalert.js' }).node}
    {Script(/* javascript */ `
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
  emit(url, input.value, input.label)
}
document.querySelectorAll('ion-checkbox[name="floating_contact_method"]').forEach(checkbox => {
  checkbox.addEventListener('ionChange', event => {
    let field = event.detail.value
    let checked = event.detail.checked
    let shop_slug = event.target.dataset.shopSlug
    let label = event.target.dataset.label
    let url = '/shop/:slug/admin/save/:field'
      .replace(':slug', shop_slug)
      .replace(':field', 'floating_contact_method')
    let value = checked ? field : ''
    label = '浮動' + label
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

function ShopAdmin(attrs: { shop: Shop }) {
  let { shop } = attrs
  let shop_slug = shop.slug
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
    { label: '服務提供者', key: 'tutor' },
  ]
  return (
    <>
      {style}
      {ShopContactsStyle}
      <ion-header>
        <ion-toolbar>
          <IonBackButton href="/app/more" backText="更多" />
          <ion-title role="heading" aria-level="1">
            {pageTitle}
          </ion-title>
        </ion-toolbar>
        <nav class="scroll-nav">
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
        <ion-list-header aria-level="2" id="payment-methods">
          付款方法
        </ion-list-header>
        <ion-note color="dark">
          <div class="ion-margin-horizontal">
            這些付款方法會在確認預約的頁面顯示。
          </div>
          <div class="ion-margin-horizontal">請提供至少一種付款方法方法。</div>
        </ion-note>
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
                  data-label={item.label}
                  data-shop-slug={shop_slug}
                >
                  浮在主頁
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

let routes: Routes = {
  '/shop/:slug/admin': {
    resolve(context) {
      let slug = context.routerMatch?.params.slug
      let shop = find(proxy.shop, { slug })
      if (!shop) {
        return {
          title: title('shop not found'),
          description: 'The shop is not found by slug',
          node: <Redirect href="/" />,
        }
      }
      let shop_name = shop.name
      return {
        title: title(shop_name),
        description: 'Admin page for ' + shop_name,
        node: <ShopAdmin shop={shop} />,
      }
    },
  },
  '/shop/:slug/admin/save/:field': {
    resolve(context) {
      if (context.type !== 'ws') {
        return {
          title: title('method not supported'),
          description: 'update shop info',
          node: 'this api is only for ws',
        }
      }
      let { slug } = context.routerMatch?.params
      let shop = find(proxy.shop, { slug })
      if (!shop) {
        return {
          title: title('shop not found'),
          description: 'update shop info',
          node: <Redirect href={`/`} />,
        }
      }
      let { 0: value, 1: label } = object({
        0: string({ nonEmpty: false, trim: true }),
        1: string({ nonEmpty: true }),
      }).parse(context.args)

      let field = shopFieldsParser.parse(context.routerMatch?.params.field)

      if (value.length == 0) {
        shop[field] = null
        let messages: ServerMessage[] = [
          ['eval', `showToast('除去了${label}','info')`],
        ]
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

      shop[field] = value

      let messages: ServerMessage[] = [
        ['eval', `showToast('更新了${label}','info')`],
      ]
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
  '/shop/:slug/admin/locale/:key': {
    resolve(context) {
      if (context.type !== 'ws') {
        return {
          title: title('method not supported'),
          description: 'update shop locale',
          node: 'this api is only for ws',
        }
      }
      let { slug } = context.routerMatch?.params
      let shop = find(proxy.shop, { slug })
      if (!shop) {
        return {
          title: title('shop not found'),
          description: 'update shop locale',
          node: <Redirect href={`/`} />,
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
}

export default { routes }
