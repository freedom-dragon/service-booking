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
let shopCompleteTitle = '注冊完成'

let style = Style(/* css */ `
  `)
function OnBoardComplete(attrs: {}, context: DynamicContext) {
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

  return (
    <>
      {style}
      <ion-header>
        <ion-toolbar color="primary">
          <IonBackButton
            href={toRouteUrl(
              onBoardSocials.routes,
              '/on-board/:shop_slug/socials',
            )}
            color="light"
            backText="Admin"
          />
          <ion-title role="heading" aria-level="1">
            {shopCompleteTitle}
          </ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content id="OnBoardAccount" class="ion-padding"></ion-content>
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
