import { config } from '../../config.js'
import { o } from '../jsx/jsx.js'
import { IonTabBar } from './ion-tab-bar.js'

export let appIonTabBar = (
  <IonTabBar
    tabs={[
      {
        tab: 'home',
        icon: 'planet',
        label: '探索',
        // href: '/app/home',
        href: '/shop/' + config.shop_slug,
      },
      {
        tab: 'calendar',
        icon: 'calendar',
        label: '預約',
        href: '/calendar',
      },
      {
        tab: 'shopping',
        icon: 'cart',
        label: '套票',
        href: '/shop/' + config.shop_slug,
      },
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
