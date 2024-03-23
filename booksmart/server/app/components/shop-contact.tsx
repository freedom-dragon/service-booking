import { Shop } from '../../../db/proxy.js'
import { o } from '../jsx/jsx.js'
import { ShopContact } from '../shop-store.js'
import { mapArray } from './fragment.js'
import Style from './style.js'

export let ShopContactsStyle = Style(/* css */ `
.social-media-buttons
.img-icon {
  max-width: 2.25rem;
  max-height: 2.25rem;
}
.social-media-buttons
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

export function ShopContacts(attrs: { shop: Shop; items: ShopContact[] }) {
  let { shop } = attrs
  return (
    <ion-buttons class="social-media-buttons ion-margin">
      {mapArray(attrs.items, item => {
        let slug = shop[item.field]
        return slug ? (
          <ion-button href={item.prefix + slug} target="_blank">
            <img
              class="img-icon"
              slot="icon-only"
              src={'/assets/contact-methods/' + item.icon}
              alt={'credit to ' + item.credit}
              aria-hidden="true"
            />
            <span class="img-icon--text" title={item.label}>
              {slug}
            </span>
          </ion-button>
        ) : null
      })}
    </ion-buttons>
  )
}
