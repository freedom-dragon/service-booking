import { config } from '../../config.js'
import { toRouteUrl } from '../../url.js'
import { getContextShop } from '../auth/shop.js'
import { Context, DynamicContext } from '../context.js'
import { o } from '../jsx/jsx.js'
import booking from '../pages/booking.js'
import shopHome from '../pages/shop-home.js'
import { IonTabBar } from './ion-tab-bar.js'

function ShopTabBar(attrs: {}, context: DynamicContext) {
  let shop = getContextShop(context)
  let shop_slug = shop.slug
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
          href: 
          toRouteUrl(booking.routes,'')
          '/booking',
        },
        // {
        //   tab: 'shopping',
        //   icon: 'cart',
        //   label: '套票',
        //   href: '/shop/' + config.shop_slug,
        // },
        {
          tab: 'notice',
          icon: 'notifications',
          label: '通知',
          href: '/app/notice',
        },
        {
          tab: 'more',
          icon: 'ellipsis-horizontal',
          label: '更多',
          href: '/app/more',
        },
      ]}
    />
  )
}

export let appIonTabBar = <ShopTabBar />
