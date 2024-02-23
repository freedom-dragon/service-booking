import { o } from '../jsx/jsx.js'
import { getShopContacts } from '../shop-store.js'
import { mapArray } from './fragment.js'
import Style from './style.js'

export type ContactItem = ReturnType<typeof getShopContacts>[number]

export let ShopContactsStyle = Style(/* css */ `
.social-media-buttons
.img-icon {
  max-width: 2.5rem;
  max-height: 2.5rem;
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

export function ShopContacts(attrs: { items: ContactItem[] }) {
  return (
    <ion-buttons class="social-media-buttons ion-margin">
      {mapArray(attrs.items, item =>
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
