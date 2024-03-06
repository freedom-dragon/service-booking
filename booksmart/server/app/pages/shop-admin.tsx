import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { apiEndpointTitle, title } from '../../config.js'
import Style from '../components/style.js'
import { Context, DynamicContext, getContextFormBody } from '../context.js'
import { mapArray } from '../components/fragment.js'
import { IonBackButton } from '../components/ion-back-button.js'
import { object, string, optional, values } from 'cast.ts'
import { Link, Redirect } from '../components/router.js'
import { renderError } from '../components/error.js'
import { getAuthUser } from '../auth/user.js'
import {
  contactFields,
  contactFieldsParser,
  getShopContacts,
} from '../shop-store.js'
import { find } from 'better-sqlite3-proxy'
import { Shop, proxy } from '../../../db/proxy.js'
import { ShopContacts, ShopContactsStyle } from '../components/shop-contact.js'
import { Script } from '../components/script.js'
import { MessageException } from '../helpers.js'
import { loadClientPlugin } from '../../client-plugin.js'
import { nodeToVNode } from '../jsx/vnode.js'

let pageTitle = '商戶管理'

let style = Style(/* css */ `
#ShopAdmin {

}
`)

let ShopAdminScripts = (
  <>
    {loadClientPlugin({ entryFile: 'dist/client/sweetalert.js' }).node}
    {Script(/* javascript */ `
function clearContact(button) {
  let url = button.dataset.saveUrl
  let item = button.closest('ion-item')
  let input = item.querySelector('ion-input')
  input.value = ''
  emit(url, '', input.label)
}
function saveContact(button) {
  let url = button.dataset.saveUrl
  let item = button.closest('ion-item')
  let input = item.querySelector('ion-input')
  emit(url, input.value, input.label)
}
`)}
  </>
)

function ShopAdmin(attrs: { shop: Shop }) {
  let { shop } = attrs
  let urlPrefix = `/shop/${shop.slug}/admin`
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
      </ion-header>
      <ion-content id="ShopAdmin" class="ion-padding" color="light">
        <ion-list-header>聯絡方法</ion-list-header>
        <ion-note color="dark">
          <div class="ion-margin-horizontal">
            這些聯繫方法會在商户主頁顯示。
          </div>
          <div class="ion-margin-horizontal">請提供至少一種聯繫方法。</div>
        </ion-note>
        {mapArray(contacts, item => {
          let slug = item.value
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
                    data-save-url={`${urlPrefix}/save/${item.field}`}
                    onclick="saveContact(this)"
                  >
                    <ion-icon name="save" slot="icon-only"></ion-icon>
                  </ion-button>
                  <ion-button
                    color="danger"
                    data-save-url={`${urlPrefix}/save/${item.field}`}
                    onclick="clearContact(this)"
                  >
                    <ion-icon name="close" slot="icon-only"></ion-icon>
                  </ion-button>
                </ion-buttons>
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

      let field = contactFieldsParser.parse(context.routerMatch?.params.field)

      if (value.length == 0) {
        shop[field] = null
        throw new MessageException([
          'batch',
          [
            ['eval', `showToast('除去了${label}','info')`],
            [
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
            ],
          ],
        ])
      }

      shop[field] = value

      throw new MessageException([
        'batch',
        [
          ['eval', `showToast('更新了${field}','info')`],
          [
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
          ],
        ],
      ])
    },
  },
}

export default { routes }
