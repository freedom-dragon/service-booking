import { LayoutType, config, title } from '../../config.js'
import { ShopContext, getShop } from '../auth/shop.js'
import { mapArray } from '../components/fragment.js'
import { IonBackButton } from '../components/ion-back-button.js'
import { Redirect } from '../components/router.js'
import Style from '../components/style.js'
import { wsStatus } from '../components/ws-status.js'
import { o } from '../jsx/jsx.js'
import { Routes } from '../routes.js'

let pageTitle = '聯絡方法'

let style = Style(/* css */ `
.img-icon {
  max-width: 2.5rem;
  max-height: 2.5rem;
}
.img-icon--text {
  margin-inline-start: 1rem;
}
.social-media-buttons {
  flex-direction: column;
  align-items: start;
  gap: 0.75rem;
}
.social-media-buttons ion-button.md {
  width: auto !important;
  --border-radius: unset !important;
}
`)

let page = (
  <>
    {style}
    <ion-header>
      <ion-toolbar>
        <IonBackButton href="/app/more" backText="More" />
        <ion-title role="heading" aria-level="1">
          {pageTitle}
        </ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <Main />
      {wsStatus.safeArea}
    </ion-content>
  </>
)

function Main(attrs: {}, context: ShopContext) {
  let { shop } = context
  let list = [
    {
      label: 'phone number',
      icon: 'phone.webp',
      prefix: 'tel:',
      slug: shop.tel,
      credit: 'Kreasi Kanvas on iconscout.com',
    },
    {
      label: 'email address',
      icon: 'gmail.webp',
      prefix: 'mailto:',
      slug: shop.email,
      credit: 'মুহম্মদ রাগিব হাসিন on wikipedia.org',
    },
    {
      label: 'street address',
      icon: 'google_map.webp',
      prefix: 'https://www.google.com/maps/search/',
      slug: shop.address,
      credit: 'Abdul Abid on iconscout.com',
    },
    {
      label: 'facebook contact',
      icon: 'Facebook_icon.svg',
      prefix: 'https://www.facebook.com/',
      slug: shop.facebook,
      credit: 'Tkgd2007 on wikipedia.org',
    },
    {
      label: 'messenger contact',
      icon: 'facebook_messenger.svg',
      prefix: 'https://m.me/',
      slug: shop.messenger,
      credit: 'Totie on wikipedia.org',
    },
    {
      label: 'instagram contact',
      icon: 'instagram.svg',
      prefix: 'https://www.instagram.com/',
      slug: shop.instagram,
      credit: 'diej4cob on wikipedia.org',
    },
    {
      label: 'youtube channel',
      icon: 'youtube.webp',
      prefix: 'https://www.youtube.com/@',
      slug: shop.youtube,
      credit: 'Pixel Icons on iconscout.com',
    },
    {
      label: 'whatsapp contact',
      icon: 'whatsapp.webp',
      prefix: 'https://wa.me/' + (shop.whatsapp?.length === 8 ? '852' : ''),
      slug: shop.whatsapp,
      credit: 'Icon Mafia on iconscout.com',
    },
    {
      label: 'telegram contact',
      icon: 'telegram.webp',
      prefix: 'https://t.me/',
      slug: shop.telegram,
      credit: 'Javitomad on wikipedia.org',
    },
    {
      label: 'twitter contact',
      icon: 'twitter.svg',
      prefix: 'https://twitter.com/',
      slug: shop.twitter,
      credit: 'Smasongarrison on wikipedia.org',
    },
  ]
  if ('dev') {
    return (
      <ion-list>
        {mapArray(list, item =>
          item.slug ? (
            <ion-item
              class="ion-margin-top"
              href={item.prefix + item.slug}
              target="_blank"
              lines="none"
            >
              <img
                class="img-icon"
                slot="start"
                src={'/assets/contact-methods/' + item.icon}
                alt={'credit to ' + item.credit}
                aria-hidden="true"
              />
              <ion-label title={item.label} color="primary">
                {item.slug}
              </ion-label>
            </ion-item>
          ) : null,
        )}
      </ion-list>
    )
  }
  return (
    <ion-buttons class="social-media-buttons ion-margin">
      {mapArray(list, item =>
        item.slug ? (
          <ion-button href={item.prefix + item.slug} target="_blank">
            <img
              class="img-icon"
              slot="icon-only"
              src={'/assets/contact-methods/' + item.icon}
              alt={'credit to ' + item.credit}
              aria-hidden="true"
            />
            <span class="img-icon--text" title={item.label}>
              {item.slug}
            </span>
          </ion-button>
        ) : null,
      )}
    </ion-buttons>
  )
}

let routes: Routes = {
  '/app/contacts': {
    layout_type: LayoutType.ionic,
    resolve(context) {
      let shop = getShop(context)
      if (!shop) {
        return {
          title: title('shop not found'),
          description: 'The shop is not found by slug',
          node: <Redirect href="/" />,
        }
      }
      return {
        title: title(pageTitle),
        description: config.site_description,
        node: page,
      }
    },
  },
}

export default {
  routes,
  pageTitle,
}
