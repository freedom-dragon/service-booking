import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { LayoutType, config, title } from '../../config.js'
import Style from '../components/style.js'
import { Link } from '../components/router.js'
import { appIonTabBar } from '../components/app-tab-bar.js'
import { fitIonFooter, selectIonTab } from '../styles/mobile-style.js'
import { readFileSync } from 'fs'
import { Context } from '../context.js'
import { getAuthUser } from '../auth/user.js'
import { toUploadedUrl } from '../upload.js'

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
        <Link tagName="ion-item" href={`/shop/${config.shop_slug}/admin`}>
          <ion-icon slot="start" ios="cog" md="settings" />
          <ion-label>商戶管理</ion-label>
        </Link>
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
      {appIonTabBar}
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

function ProfileItems(attrs: {}, context: Context) {
  let user = getAuthUser(context)
  if (!user) {
    return (
      <Link tagName="ion-item" href="/login">
        <ion-icon slot="start" name="log-in" />
        <ion-label>登入</ion-label>
      </Link>
    )
  }
  return (
    <Link tagName="ion-item" href="/profile">
      <ion-icon slot="start" name="person-outline" />
      <ion-label>聯絡資料</ion-label>
    </Link>
  )
}

let routes: Routes = {
  '/app/more': {
    title: title(pageTitle),
    description: 'TODO',
    node: page,
    layout_type: LayoutType.ionic,
  },
}

export default { routes }
