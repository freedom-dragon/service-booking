import { filter } from 'better-sqlite3-proxy'
import { Shop, proxy } from '../../db/proxy.js'
import { readdirSync } from 'fs'
import { TimezoneDate } from 'timezone-date.ts'
import { format_2_digit } from '@beenotung/tslib/format.js'

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

export function getShopContacts(shop: Shop) {
  return [
    {
      label_en: 'phone number',
      label: '電話號碼',
      type: 'tel',
      icon: 'phone.webp',
      prefix: 'tel:',
      slug: shop.tel,
      credit: 'Kreasi Kanvas on iconscout.com',
    },
    {
      label_en: 'email address',
      label: '電郵地址',
      type: 'email',
      icon: 'gmail.webp',
      prefix: 'mailto:',
      slug: shop.email,
      credit: 'মুহম্মদ রাগিব হাসিন on wikipedia.org',
    },
    {
      label_en: 'street address',
      label: '街道地址',
      type: 'text',
      icon: 'google_map.webp',
      prefix: 'https://www.google.com/maps/search/',
      slug: shop.address,
      credit: 'Abdul Abid on iconscout.com',
    },
    {
      label_en: 'facebook contact',
      label: 'Facebook 用戶名',
      type: 'text',
      icon: 'Facebook_icon.svg',
      prefix: 'https://www.facebook.com/',
      slug: shop.facebook,
      credit: 'Tkgd2007 on wikipedia.org',
    },
    {
      label_en: 'messenger contact',
      label: 'Facebook Messenger 用戶名',
      type: 'text',
      icon: 'facebook_messenger.svg',
      prefix: 'https://m.me/',
      slug: shop.messenger,
      credit: 'Totie on wikipedia.org',
    },
    {
      label_en: 'instagram contact',
      label: 'Instagram 用戶名',
      type: 'text',
      icon: 'instagram.svg',
      prefix: 'https://www.instagram.com/',
      slug: shop.instagram,
      credit: 'diej4cob on wikipedia.org',
    },
    {
      label_en: 'youtube channel',
      label: 'Youtube 頻道',
      type: 'text',
      icon: 'youtube.webp',
      prefix: 'https://www.youtube.com/@',
      slug: shop.youtube,
      credit: 'Pixel Icons on iconscout.com',
    },
    {
      label_en: 'whatsapp contact',
      label: 'WhatsApp 號碼',
      type: 'tel',
      icon: 'whatsapp.webp',
      prefix: 'https://wa.me/' + (shop.whatsapp?.length === 8 ? '852' : ''),
      slug: shop.whatsapp,
      credit: 'Icon Mafia on iconscout.com',
    },
    {
      label_en: 'telegram contact',
      label: 'Telegram 用戶名',
      type: 'text',
      icon: 'telegram.webp',
      prefix: 'https://t.me/',
      slug: shop.telegram,
      credit: 'Javitomad on wikipedia.org',
    },
    {
      label_en: 'twitter contact',
      label: 'Twitter 用戶名',
      type: 'text',
      icon: 'twitter.svg',
      prefix: 'https://twitter.com/',
      slug: shop.twitter,
      credit: 'Smasongarrison on wikipedia.org',
    },
  ]
}

export function toDatePart(date: TimezoneDate) {
  date.timezone = +8
  let y = date.getFullYear()
  let m = date.getMonth() + 1
  let d = date.getDate()
  let str = [y, format_2_digit(m), format_2_digit(d)].join('-')
  return str
}
