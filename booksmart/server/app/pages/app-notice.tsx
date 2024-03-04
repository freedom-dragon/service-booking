import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'
import { LayoutType, title } from '../../config.js'
import Style from '../components/style.js'
import { Context } from '../context.js'
import { mapArray } from '../components/fragment.js'
import { appIonTabBar } from '../components/app-tab-bar.js'
import { fitIonFooter, selectIonTab } from '../styles/mobile-style.js'

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
      {appIonTabBar}
      {selectIonTab('notice')}
    </ion-footer>
    {fitIonFooter}
  </>
)

let items = [
  { title: 'Katy 已確定了情侶班的預約', timestamp: '2024-02-25 13:30' },
  { title: 'Katy 已確定了體驗班的預約', timestamp: '2024-02-20 11:15' },
]

function Main(attrs: {}, context: Context) {
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

let routes: Routes = {
  '/app/notice': {
    title: title(pageTitle),
    description: 'TODO',
    node: page,
    layout_type: LayoutType.ionic,
  },
}

export default { routes }
