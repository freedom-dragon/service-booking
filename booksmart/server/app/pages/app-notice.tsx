import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { LayoutType, title } from '../../config.js'
import Style from '../components/style.js'
import { Context } from '../context.js'
import { mapArray } from '../components/fragment.js'
import { AppTabBar } from '../components/app-tab-bar.js'
import { fitIonFooter, selectIonTab } from '../styles/mobile-style.js'
import { getAuthUser } from '../auth/user.js'
import { find } from 'better-sqlite3-proxy'
import { proxy } from '../../../db/proxy.js'
import { db } from '../../../db/db.js'
import { relative_timestamp } from '../components/timestamp.js'

let pageTitle = '通知'

let style = Style(/* css */ `
#Notice {

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
    <ion-content id="Notice" class="ion-padding">
      <Main />
    </ion-content>
    <ion-footer>
      <AppTabBar />
      {selectIonTab('notice')}
    </ion-footer>
    {fitIonFooter}
  </>
)

let select_booking_by_shop = db
  .prepare(
    /* sql */ `
select
  booking.id
from booking
inner join service on service.id = booking.service_id
where service.shop_id = :shop_id
order by booking.updated_at desc
`,
  )
  .pluck()

function Main(attrs: {}, context: Context) {
  let user = getAuthUser(context)
  let shop = user ? find(proxy.shop, { owner_id: user.id! }) : null
  let items: { title: string; timestamp: string }[] = [
    // { title: 'Katy 已確定了情侶班的預約', timestamp: '2024-02-25 13:30' },
    // { title: 'Katy 已確定了體驗班的預約', timestamp: '2024-02-20 11:15' },
  ]
  if (shop) {
    let booking_ids = select_booking_by_shop.all({
      shop_id: shop.id,
    }) as number[]
    for (let id of booking_ids) {
      let booking = proxy.booking[id]
      if (booking.cancel_time) {
        items.push({
          title: (
            <span>
              {booking.user!.nickname} 取消了 {booking.service!.name} 的預約
            </span>
          ),
          timestamp: relative_timestamp(booking.cancel_time),
        })
      } else {
        items.push({
          title: (
            <span>
              {booking.user!.nickname} 申請預約 {booking.service!.name}
            </span>
          ),
          timestamp: relative_timestamp(booking.submit_time),
        })
      }
    }
  }
  if (items.length == 0) {
    return <p class="ion-text-center">暫時未有通知</p>
  }
  return (
    <>
      <ion-list>
        {mapArray(items, item => (
          <ion-item>
            <ion-label>{item.title}</ion-label>
            <ion-note slot="end" color="dark" style="font-size: smaller">
              ({item.timestamp})
            </ion-note>
          </ion-item>
        ))}
      </ion-list>
    </>
  )
}

let routes = {
  '/shop/:shop_slug/notice': {
    title: title(pageTitle),
    description: 'Notices about the shop',
    node: page,
    layout_type: LayoutType.ionic,
  },
} satisfies Routes

export default { routes }
