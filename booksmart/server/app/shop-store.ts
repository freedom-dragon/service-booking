import { filter } from 'better-sqlite3-proxy'
import { Shop, proxy } from '../../db/proxy.js'
import { readdirSync } from 'fs'
import { TimezoneDate } from 'timezone-date.ts'
import { format_2_digit } from '@beenotung/tslib/format.js'
import { values } from 'cast.ts'

export function getShopLocale(shop_id: number) {
  let rows = filter(proxy.shop_locale, { shop_id })
  let dict: Record<string, string> = {}
  for (let row of rows) {
    dict[row.key] = row.value
  }
  let locale = dict as {
    tutor: string
    service: string
  }
  locale.tutor ||= '導師'
  locale.service ||= '服務'
  return locale
}

export function getShopLogoImage(shop_slug: string) {
  return `/assets/shops/${shop_slug}/logo.webp`
}

export function getShopCoverImage(shop_slug: string) {
  return `/assets/shops/${shop_slug}/cover.webp`
}

export function getServiceCoverImage(shop_slug: string, service_slug: string) {
  return `/assets/shops/${shop_slug}/${service_slug}/cover.webp`
}

export function getServiceOptionImage(
  shop_slug: string,
  service_slug: string,
  option_id: number,
) {
  return `/assets/shops/${shop_slug}/${service_slug}/option-${option_id}.webp`
}

export function getServiceImages(shop_slug: string, service_slug: string) {
  let dir = `assets/shops/${shop_slug}/${service_slug}`
  let filenames = readdirSync(`public/${dir}`)
  let cover = getServiceCoverImage(shop_slug, service_slug)
  let more: string[] = []
  let options: string[] = []
  for (let filename of filenames) {
    if (filename.startsWith('more-')) {
      more.push(`/${dir}/${filename}`)
    } else if (filename.startsWith('option-')) {
      options.push(`/${dir}/${filename}`)
    }
  }
  return { cover, more, options }
}

export function getReceiptImage(
  shop_slug: string,
  service_slug: string,
  receipt_filename: string,
) {
  return `/assets/shops/${shop_slug}/${service_slug}/receipts/${receipt_filename}`
}

export let paymentMethodGroups = [
  {
    items: [
      {
        label: 'Payme 電話號碼',
        field: 'payme_tel',
        type: 'tel',
        placeholder: 'e.g. 9876 5432',
      },
      {
        label: 'PayLink',
        field: 'payme_link',
        type: 'url',
        placeholder:
          'e.g. https://qr.payme.hsbc.com.hk/1/Sdbp9aVY7PFEwLpUXWKHeG',
      },
    ],
  },
  {
    items: [
      {
        label: 'FPS 電話號碼',
        field: 'fps_tel',
        type: 'tel',
        placeholder: 'e.g. 9876 5432',
      },
      {
        label: 'FPS 電郵地址',
        field: 'fps_email',
        type: 'email',
        placeholder: 'e.g. info@booksmart.hk',
      },
      {
        label: 'FPS ID',
        field: 'fps_id',
        type: 'number',
        placeholder: 'e.g. 123456789',
      },
    ],
  },
  {
    items: [
      {
        label: '銀行名稱',
        field: 'fps_tel',
        type: 'tel',
        placeholder: 'e.g. 恒生銀行',
      },
      {
        label: '銀行戶口號碼',
        field: 'fps_email',
        type: 'email',
        placeholder: 'e.g. 371 3333336 668',
      },
      {
        label: '銀行戶口名稱',
        field: 'fps_id',
        type: 'number',
        placeholder: 'e.g. BookSmart Limited',
      },
    ],
  },
] satisfies {
  items: {
    field: keyof Shop
    [key: string]: string
  }[]
}[]

export type ShopPaymentMethod =
  (typeof paymentMethodGroups)[number]['items'][number]

export let paymentFields = paymentMethodGroups.flatMap(group =>
  group.items.map(item => item.field),
)

export function getShopContacts(shop: Shop) {
  return [
    {
      label_en: 'phone number',
      label: '電話號碼',
      type: 'tel',
      icon: 'phone.webp',
      prefix: 'tel:',
      field: 'tel',
      credit: 'Kreasi Kanvas on iconscout.com',
    },
    {
      label_en: 'email address',
      label: '電郵地址',
      type: 'email',
      icon: 'gmail.webp',
      prefix: 'mailto:',
      field: 'email',
      credit: 'মুহম্মদ রাগিব হাসিন on wikipedia.org',
    },
    {
      label_en: 'street address',
      label: '街道地址',
      type: 'text',
      icon: 'google_map.webp',
      prefix: 'https://www.google.com/maps/search/',
      field: 'address',
      credit: 'Abdul Abid on iconscout.com',
    },
    {
      label_en: 'facebook contact',
      label: 'Facebook 用戶名',
      type: 'text',
      icon: 'Facebook_icon.svg',
      prefix: 'https://www.facebook.com/',
      field: 'facebook',
      credit: 'Tkgd2007 on wikipedia.org',
    },
    {
      label_en: 'messenger contact',
      label: 'Facebook Messenger 用戶名',
      type: 'text',
      icon: 'facebook_messenger.svg',
      prefix: 'https://m.me/',
      field: 'messenger',
      credit: 'Totie on wikipedia.org',
    },
    {
      label_en: 'instagram contact',
      label: 'Instagram 用戶名',
      type: 'text',
      icon: 'instagram.svg',
      prefix: 'https://www.instagram.com/',
      field: 'instagram',
      credit: 'diej4cob on wikipedia.org',
    },
    {
      label_en: 'youtube channel',
      label: 'Youtube 頻道',
      type: 'text',
      icon: 'youtube.webp',
      prefix: 'https://www.youtube.com/@',
      field: 'youtube',
      credit: 'Pixel Icons on iconscout.com',
    },
    {
      label_en: 'whatsapp contact',
      label: 'WhatsApp 號碼',
      type: 'tel',
      icon: 'whatsapp.webp',
      prefix: 'https://wa.me/' + (shop.whatsapp?.length === 8 ? '852' : ''),
      field: 'whatsapp',
      credit: 'Icon Mafia on iconscout.com',
    },
    {
      label_en: 'telegram contact',
      label: 'Telegram 用戶名',
      type: 'text',
      icon: 'telegram.webp',
      prefix: 'https://t.me/',
      field: 'telegram',
      credit: 'Javitomad on wikipedia.org',
    },
    {
      label_en: 'twitter contact',
      label: 'Twitter 用戶名',
      type: 'text',
      icon: 'twitter.svg',
      prefix: 'https://twitter.com/',
      field: 'twitter',
      credit: 'Smasongarrison on wikipedia.org',
    },
  ] satisfies {
    field: keyof Shop
    [key: string]: string
  }[]
}

export type ShopContact = ReturnType<typeof getShopContacts>[number]

export let contactFields = getShopContacts({} as Shop).map(item => item.field)

export let shopFieldsParser = values([...paymentFields, ...contactFields])

export function toDatePart(date: TimezoneDate) {
  date.timezone = +8
  let y = date.getFullYear()
  let m = date.getMonth() + 1
  let d = date.getDate()
  let str = [y, format_2_digit(m), format_2_digit(d)].join('-')
  return str
}

export function fromDatePart(dateStr: string) {
  let date = new TimezoneDate()
  date.timezone = +8
  date.setHours(0, 0, 0, 0)
  let [y, m, d] = dateStr.split('-')
  date.setFullYear(+y, +m, +d)
  return date
}
