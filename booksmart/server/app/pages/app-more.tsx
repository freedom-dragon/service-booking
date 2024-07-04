import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { LayoutType, title } from '../../config.js'
import Style from '../components/style.js'
import { Link } from '../components/router.js'
import { AppTabBar } from '../components/app-tab-bar.js'
import { fitIonFooter, selectIonTab } from '../styles/mobile-style.js'
import { readFileSync } from 'fs'
import { Context, DynamicContext } from '../context.js'
import { getAuthUser } from '../auth/user.js'
import { toUploadedUrl } from '../upload.js'
import { getContextShopSlug } from '../auth/shop.js'
import { toRouteUrl } from '../../url.js'
import shopAdmin from './shop-admin.js'
import { IonBackButton } from '../components/ion-back-button.js'
import { loginRouteUrl } from './login.js'
import profile from './profile.js'

let pageTitle = '更多'

let style = Style(/* css */ `
#More {

}
`)

let page = (
  <>
    {style}
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title role="heading" aria-level="1">
          {pageTitle}
        </ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content id="More" class="ion-padding">
      <ProfileHeader />
      <ion-list>
        <ProfileItems />
        <Link tagName="ion-item" href="/app/about" hidden>
          <ion-icon slot="start" name="information" />
          <ion-label>關於我們</ion-label>
        </Link>
        <ShopItems />
        <Link tagName="ion-item" href="/settings" hidden>
          <ion-icon slot="start" ios="cog" md="settings" />
          <ion-label>Settings</ion-label>
        </Link>
        <Link tagName="ion-item" href="/terms" disabled>
          <ion-icon slot="start" name="book" />
          <ion-label>Terms and Conditions</ion-label>
        </Link>
        <Link tagName="ion-item" href="/privacy" disabled>
          <ion-icon slot="start" name="glasses" />
          <ion-label>Privacy Policy</ion-label>
        </Link>
        <ion-item>
          <ion-icon slot="start" name="server" />
          <ion-label>
            Version{' '}
            {JSON.parse(readFileSync('package.json').toString()).version}
          </ion-label>
        </ion-item>
      </ion-list>
      <div class="ion-text-center">
        <img
          src="/assets/powered-by-BookSmart.webp"
          style="max-width: 8rem; margin-top: 2rem"
        />
      </div>
    </ion-content>
    <ion-footer>
      <AppTabBar />
      {selectIonTab('more')}
    </ion-footer>
    {fitIonFooter}
  </>
)

function ProfileHeader(attrs: {}, context: Context) {
  let user = getAuthUser(context)
  let name = user?.nickname || '訪客'
  let avatar = toUploadedUrl(
    user?.avatar || 'https://picsum.photos/seed/logo/128/128',
  )
  return (
    <>
      <ion-avatar
        style="
          margin:auto;
          height:128px;
          width :128px;
        "
      >
        <img src={avatar} />
      </ion-avatar>
      <h2
        style="
          margin-top:0.25rem;
          text-align:center;
        "
      >
        {name}
      </h2>
    </>
  )
}

function ProfileItems(attrs: {}, context: DynamicContext) {
  let shop_slug = getContextShopSlug(context)
  let user = getAuthUser(context)
  if (!user) {
    return (
      <Link tagName="ion-item" href={loginRouteUrl(context)}>
        <ion-icon slot="start" name="log-in" />
        <ion-label>登入</ion-label>
      </Link>
    )
  }
  return (
    <Link
      tagName="ion-item"
      href={toRouteUrl(profile.routes, '/shop/:shop_slug/profile', {
        params: { shop_slug },
      })}
    >
      <ion-icon slot="start" name="person-outline" />
      <ion-label>聯絡資料</ion-label>
    </Link>
  )
}

function ShopItems(attrs: {}, context: DynamicContext) {
  let shop_slug = getContextShopSlug(context)
  return (
    <Link
      tagName="ion-item"
      href={toRouteUrl(shopAdmin.routes, '/shop/:shop_slug/admin', {
        params: { shop_slug },
      })}
    >
      <ion-icon slot="start" ios="cog" md="settings" />
      <ion-label>商戶管理</ion-label>
    </Link>
  )
}

export function AppMoreBackButton(
  attrs: { color?: string },
  context: DynamicContext,
) {
  let shop_slug = getContextShopSlug(context)
  return (
    <IonBackButton
      href={toRouteUrl(routes, '/shop/:shop_slug/more', {
        params: { shop_slug },
      })}
      backText="更多"
      color={attrs.color}
    />
  )
}

let routes = {
  '/shop/:shop_slug/more': {
    title: title(pageTitle),
    description: 'TODO',
    node: page,
    layout_type: LayoutType.ionic,
  },
} satisfies Routes

export default { routes }
