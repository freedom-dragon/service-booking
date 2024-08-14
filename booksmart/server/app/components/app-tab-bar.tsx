import { toRouteUrl } from '../../url.js'
import { getContextShopSlug } from '../auth/shop.js'
import { DynamicContext } from '../context.js'
import { o } from '../jsx/jsx.js'
import appMore from '../pages/app-more.js'
import appNotice from '../pages/app-notice.js'
import booking from '../pages/booking.js'
import Package from '../pages/package.js'
import shopHome from '../pages/shop-home.js'
import { IonTabBar } from './ion-tab-bar.js'

export function AppTabBar(attrs: {}, context: DynamicContext) {
  let shop_slug = getContextShopSlug(context)
  return (
    <IonTabBar
      tabs={[
        {
          tab: 'home',
          icon: 'planet',
          label: '預約',
          href: toRouteUrl(shopHome.routes, '/shop/:shop_slug', {
            params: { shop_slug },
          }),
        },
        {
          tab: 'booking',
          icon: 'calendar',
          label: '行程',
          href: toRouteUrl(booking.routes, '/shop/:shop_slug/booking', {
            params: { shop_slug },
          }),
        },
        {
          tab: 'package',
          icon: 'ticket',
          label: '套票',
          href: toRouteUrl(Package.routes, '/shop/:shop_slug/package', {
            params: { shop_slug },
          }),
        },
        {
          tab: 'notice',
          icon: 'notifications',
          label: '通知',
          href: toRouteUrl(appNotice.routes, '/shop/:shop_slug/notice', {
            params: { shop_slug },
          }),
        },
        {
          tab: 'more',
          icon: 'ellipsis-horizontal',
          label: '更多',
          href: toRouteUrl(appMore.routes, '/shop/:shop_slug/more', {
            params: { shop_slug },
          }),
        },
      ]}
    />
  )
}
