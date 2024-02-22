import { filter } from 'better-sqlite3-proxy'
import { proxy } from '../../db/proxy.js'
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

export function toDatePart(date: TimezoneDate) {
  date.timezone = +8
  let y = date.getFullYear()
  let m = date.getMonth() + 1
  let d = date.getDate()
  let str = [y, format_2_digit(m), format_2_digit(d)].join('-')
  return str
}
